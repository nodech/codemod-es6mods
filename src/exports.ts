import type { FileInfo } from 'jscodeshift';
import j from 'jscodeshift';
import { namedTypes as t } from 'ast-types';
import { TransformError } from './common.ts';
import * as queries from './queries.ts';
import * as utils from './utils.ts';

export default function transformExportsAPI(file: FileInfo, _, options) {
  const transformed = transformExports(file.source, file);

  if (!options.dontVerify) {
    return transformed;
  }

  if (transformed.includes('exports')) {
    // possible comments.
    console.error('Found exports in the source code after transformation.',
      file.path);
  }

  const root = j(transformed);
  const exports = root.find(j.Identifier, { name: 'exports' });

  if (exports.length > 0) {
    throw new TransformError(
      'Found exports in the source code after transformation.',
      file, exports.at(0).get().value.loc
    );
  }

  return transformed;
}

export function transformExports(source: string, file?: FileInfo): string {
  const root = j(source);

  const badExports = queries.getBadExport(root);

  if (badExports.length > 0) {
    const nodePath = badExports.at(0).get();
    throw new TransformError(
      'Found bad export alias. Please remove it before running the transform.',
      file, nodePath.value.loc
    );
  }

  const details = {
    hasNormalExports: utils.hasNormalExports(root),
    normalExportAlias: utils.getNormalExportAlias(root),
    moduleExportsAlias: utils.getModuleExportsName(root),
  };

  if (!details.moduleExportsAlias
    && !details.normalExportAlias
    && !details.hasNormalExports) {
    return;
  }

  if (details.moduleExportsAlias && details.normalExportAlias) {
    throw new TransformError(
      'Both module.exports and normal export alias found.',
      file,
      root.get().value.loc
    );
  }

  if (details.moduleExportsAlias && details.hasNormalExports) {
    throw new TransformError(
      'Both module.exports and normal exports found.',
      file,
      root.get().value.loc
    );
  }

  if (details.hasNormalExports && details.normalExportAlias) {
    throw new TransformError(
      'Normal exports and export alias found.'
      + ' Please remove the alias before running the transform.',
      file,
      root.get().value.loc
    );
  }

  if (details.moduleExportsAlias) {
    throw new Error('Not supported for now.');
  } else {
    const name = details.normalExportAlias || 'exports';

    findAndReplaceInPlaceExport(root, file, name);
    findAndReplaceLocalExportUsage(root, file, name);

    if (details.normalExportAlias) {
      // If we have a normal export alias, we need to remove it.
      const normalExportAlias = queries.getNormalExportAlias(root).at(0);
      normalExportAlias.remove();
    }
  }

  return root.toSource({
    quote: 'single',
    exportsNewline: true
  });
}

function findAndReplaceInPlaceExport(
  root: j.Collection<j.Program>,
  file: FileInfo,
  name: string | null
) {
  const exports = queries.getExportsDotIdentifiers(root, name);

  const identifierExports = [];

  const replace = (exportNode: j.ASTPath<j.ExpressionStatement>) => {
    const expression = exportNode.node.expression as t.AssignmentExpression;
    const left = expression.left as t.MemberExpression;
    const expName = (left.property as t.Identifier).name;
    const right = j(expression.right);

    let declaration;

    if (right.isOfType(j.FunctionExpression)) {
      // alias|exports.exportName = function someName() { ... }
      // to
      // export function exportName() { ... }
      declaration = j.exportNamedDeclaration(
        j.functionDeclaration(
          j.identifier(expName),
          right.get().value.params,
          right.get().value.body
        )
      );
    } else if (right.isOfType(j.ArrowFunctionExpression)) {
      // alias|exports.exportName = () => { ... }
      // to
      // export function exportName
      declaration = j.exportNamedDeclaration(
        j.functionDeclaration(
          j.identifier(expName),
          right.get().value.params,
          right.get().value.body
        )
      );
    } else if (right.isOfType(j.CallExpression)
            && right.get().value.callee.name === 'require') {
      // ignore alias|exports.exportName = require('...');
      // do nothing, leave it for the import transformer
      return;
    } else if (right.isOfType(j.Identifier)) {
      const exportedName = right.get().value.name;

      // skip alias.exportName = alias;
      if (exportedName !== name) {
        identifierExports.push({
          local: right.get().value.name,
          exported: expName,
        });
      }

      j(exportNode).remove();
      return;
    } else {
      // alias|exports.exportName = everything else
      // to
      // export const exportName = ...
      declaration = j.exportNamedDeclaration(
        j.variableDeclaration('const', [
          j.variableDeclarator(j.identifier(expName), right.get().value)
        ])
      );
    }


    declaration.comments = exportNode.get().value.comments;
    j(exportNode).replaceWith(declaration);
  };

  exports.forEach(replace);

  if (identifierExports.length !== 0) {
    const bundledExports = utils.createExportNamedDecls(identifierExports)
    root.get().value.program.body.push(bundledExports);
  }
}

function findAndReplaceLocalExportUsage(
  root: j.Collection<j.Program>,
  file: FileInfo,
  alias: string
) {
  const exports = root.find(j.MemberExpression, {
    object: { type: 'Identifier', name: alias },
    property: { type: 'Identifier' }
  });

  exports.forEach((exportNode: j.ASTPath<j.MemberExpression>) => {
    const property = exportNode.node.property as t.Identifier;
    const propName = property.name;
    j(exportNode).replaceWith(j.identifier(propName));
  });
}
