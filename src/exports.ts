import type { FileInfo } from 'jscodeshift';
import j from 'jscodeshift';
import { namedTypes as t } from 'ast-types';
import { TransformError } from './common.ts';

export default async function transformExportsAPI(file: FileInfo) {
  const details: {
    moduleExportsAlias: string | null;
    exportAlias: string | null;
    hasNormalExports: boolean;
  } = {
    moduleExportsAlias: null,
    exportAlias: null,
    hasNormalExports: false
  };

  const root = j(file.source);

  details.exportAlias = findAndRemoveExportAlias(root, file);
  details.moduleExportsAlias = findAndReplaceDefaultExport(root, file);
  details.hasNormalExports = hasNormalExports(root);

  if (!details.moduleExportsAlias && !details.exportAlias && !details.hasNormalExports) {
    return;
  }

  if (details.moduleExportsAlias && details.exportAlias) {
    throw new TransformError('Both module.exports and exports alias found.',
      file, root.get().value.loc);
  }

  if (details.moduleExportsAlias && details.hasNormalExports) {
    throw new TransformError('Both module.exports and normal exports found.',
      file, root.get().value.loc);
  }

  if (!details.moduleExportsAlias) {
    findAndReplaceInPlaceExport(root, file, details.exportAlias);
  } else {
    findAndReplaceFinalExports(root, file, details.moduleExportsAlias);
  }

  return root.toSource({
    quote: 'single',
    exportsNewline: true
  });
}

export function transformExports(source: string, file?: FileInfo): string {
  const details: {
    moduleExportsAlias: string | null;
    exportAlias: string | null;
    hasNormalExports: boolean;
  } = {
    moduleExportsAlias: null,
    exportAlias: null,
    hasNormalExports: false
  };

  const root = j(source);

  details.exportAlias = findAndRemoveExportAlias(root, file);
  details.moduleExportsAlias = findAndReplaceDefaultExport(root, file);
  details.hasNormalExports = hasNormalExports(root);

  if (!details.moduleExportsAlias && !details.exportAlias && !details.hasNormalExports) {
    return;
  }

  if (details.moduleExportsAlias && details.exportAlias) {
    throw new TransformError('Both module.exports and exports alias found.',
      file, root.get().value.loc);
  }

  if (details.moduleExportsAlias && details.hasNormalExports) {
    throw new TransformError('Both module.exports and normal exports found.',
      file, root.get().value.loc);
  }

  if (!details.moduleExportsAlias) {
    findAndReplaceInPlaceExport(root, file, details.exportAlias);
  } else {
    findAndReplaceFinalExports(root, file, details.moduleExportsAlias);
  }

  return root.toSource({
    quote: 'single',
    exportsNewline: true
  });
}

function hasNormalExports(root: j.Collection<j.Program>): boolean {
  const decls = root.find(j.ExpressionStatement, {
    expression: {
      type: 'AssignmentExpression',
      operator: '=',
      left: {
        type: 'MemberExpression',
        object: { type: 'Identifier', name: 'exports' },
        property: { type: 'Identifier' }
      },
    }
  });

  return decls.length > 0;
}

function findAndRemoveExportAlias(root: j.Collection<j.Program>, file: FileInfo): string | null {
  const decls = root.find(j.VariableDeclaration, {
    kind: 'const',
    declarations: [{
      type: 'VariableDeclarator',
      id: { type: 'Identifier' },
      init: {
        type: 'Identifier',
        name: 'exports'
      }
    }]
  });

  if (decls.length === 0) {
    return null;
  }

  if (decls.length > 1) {
    const second = decls.at(1).get();
    throw new TransformError('Multiple exports declarations found', file, second.value.loc);
  }

  const declColl = decls.at(0);
  const decl = declColl.get().value.declarations[0] as t.VariableDeclarator;
  const init = decl.id as t.Identifier;

  decls.remove();

  return init.name;
}

function findAndReplaceDefaultExport(root: j.Collection<j.Program>, file: FileInfo): string | null {
  // module.exports = Identifier
  const defaultExport = root.find(j.ExpressionStatement, {
    expression: {
      type: 'AssignmentExpression',
      operator: '=',
      left: {
        type: 'MemberExpression',
        object: { type: 'Identifier', name: 'module' },
        property: { type: 'Identifier', name: 'exports' },
      },
      right: { type: 'Identifier' }
    }
  });

  if (defaultExport.length === 0) {
    return null;
  }

  if (defaultExport.length > 1) {
    const secondPath = defaultExport.at(1).get();
    throw new TransformError('Multiple module.exports declarations found', file, secondPath.value.loc);
  }

  const aliasNode = defaultExport.at(0).get().value;
  const aliasID = aliasNode.expression.right as t.Identifier;
  const name = aliasID.name;

  const newDeclaration = j.exportDefaultDeclaration(j.identifier(name))
  newDeclaration.comments = aliasNode.comments;

  defaultExport.replaceWith(newDeclaration);

  return name;
}

function findAndReplaceInPlaceExport(root: j.Collection<j.Program>, file: FileInfo, alias: string | null) {
  // exports.exportName = ...
  const legacyExports = root.find(j.ExpressionStatement, {
    expression: {
      type: 'AssignmentExpression',
      operator: '=',
      left: {
        type: 'MemberExpression',
        object: { type: 'Identifier', name: 'exports' },
      }
    }
  });

  let aliasExports = null;

  if (alias) {
    aliasExports = root.find(j.ExpressionStatement, {
      expression: {
        type: 'AssignmentExpression',
        operator: '=',
        left: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: alias },
        }
      }
    });
  }

  const replace = (exportNode: j.ASTPath<j.ExpressionStatement>) => {
    const expression = exportNode.node.expression as t.AssignmentExpression;
    const left = expression.left as t.MemberExpression;
    const name = (left.property as t.Identifier).name;
    const right = j(expression.right);

    let declaration;

    if (right.isOfType(j.FunctionExpression)) {
      // alias|exports.exportName = function someName() { ... }
      // to
      // export function exportName() { ... }
      declaration = j.exportNamedDeclaration(
        j.functionDeclaration(j.identifier(name), right.get().value.params, right.get().value.body)
      );
    } else if (right.isOfType(j.ArrowFunctionExpression)) {
      // alias|exports.exportName = () => { ... }
      // to
      // export function exportName
      declaration = j.exportNamedDeclaration(
        j.functionDeclaration(j.identifier(name), right.get().value.params, right.get().value.body)
      );
    } else if (right.isOfType(j.CallExpression) && right.get().value.callee.name === 'require') {
      // do nothing, leave it for the import transformer
      return;
    } else {
      // alias|exports.exportName = everything else to
      // export const exportName = ...
      declaration = j.exportNamedDeclaration(
        j.variableDeclaration('const', [
          j.variableDeclarator(j.identifier(name), right.get().value)
        ])
      );
    }


    declaration.comments = exportNode.get().value.comments;
    j(exportNode).replaceWith(declaration);
  };

  legacyExports.forEach(replace);

  if (aliasExports) {
    aliasExports.forEach(replace);
  }
}

function findAndReplaceFinalExports(root: j.Collection<j.Program>, file: FileInfo, alias: string) {
  const exports = root.find(j.ExpressionStatement, {
    expression: {
      type: 'AssignmentExpression',
      operator: '=',
      left: {
        type: 'MemberExpression',
        object: { type: 'Identifier', name: alias },
      }
    }
  });


  const finalExports = [];
  let comments = []

  if (exports.length > 0) {
    comments = exports.at(0).get().value.comments || [];
  }

  exports.forEach(exportNode => {
    const expression = exportNode.node.expression as t.AssignmentExpression;
    const left = expression.left as t.MemberExpression;
    const name = (left.property as t.Identifier).name;
    const right = j(expression.right);

    if (!right.isOfType(j.Identifier)) {
      const exportDeclaration = j.exportNamedDeclaration(
        j.variableDeclaration('const', [
          j.variableDeclarator(j.identifier(name), right.get().value)
        ])
      );

      exportDeclaration.comments = exportNode.node.comments;

      j(exportNode).replaceWith(exportDeclaration);

      // throw new TransformError(`Non-identifier exports are not supported, yet?`,
      //   file, exportNode.node.loc);
      return;
    }

    finalExports.push({
      local: right.get().value.name,
      exported: name
    })

    j(exportNode).remove();
  });

  const moduleExports = root.find(j.ExportDefaultDeclaration)
  const moduleExportsNode = (moduleExports.at(0).get().value as t.ExportDefaultDeclaration);
  const moduleExportsName = (moduleExportsNode.declaration as t.Identifier).name;

  const alreadyExporting = finalExports.some(({ exported }) => exported === moduleExportsName);

  // Re export the default export as a named export as well.
  if (!alreadyExporting) {
    finalExports.push({
      local: moduleExportsName,
      exported: moduleExportsName
    });
  }

  if (comments.length === 0 && moduleExportsNode.comments) {
    comments = moduleExportsNode.comments;
    moduleExportsNode.comments = [];
  }

  const allExports = j.exportNamedDeclaration(null, finalExports.map(({ local, exported }) => {
    return j.exportSpecifier.from({
      local: j.identifier(local),
      exported: j.identifier(exported)
    });
  }));

  allExports.comments = comments;

  moduleExports.insertBefore(allExports);
}

function isCommentExpose(comment: t.Comment): boolean {
  console.log(comment);
  return true;
  // return comment.type === 'CommentBlock' && comment.value.startsWith('expose:');
}
