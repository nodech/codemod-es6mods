import j from 'jscodeshift';
import * as queries from './queries.ts';

export function hasNormalExports(root: j.Collection<j.Program>): boolean {
  return queries.getExportsDotIdentifiers(root).length > 0;
}

export function getNormalExportAlias(root: j.Collection<j.Program>): string | null {
  const aliases = queries.getNormalExportAlias(root);

  if (aliases.length > 1) {
    throw new Error('Multiple normal export aliases found.');
  }

  if (aliases.length === 0) {
    return null;
  }

  const node = aliases.at(0).get().value as j.VariableDeclaration;
  const decl = node.declarations[0] as j.VariableDeclarator;
  const init = decl.id as j.Identifier;

  return init.name;
}

export function getModuleExportsName(root: j.Collection<j.Program>): string | null {
  const moduleExports = queries.getModuleExports(root);

  if (moduleExports.length > 1) {
    throw new Error('Multiple module.exports declarations found.');
  }

  if (moduleExports.length === 0) {
    return null;
  }

  const node = moduleExports.at(0).get().value as j.ExpressionStatement;
  const expr = node.expression as j.AssignmentExpression;
  const right = expr.right as j.Identifier;

  return right.name;
}

export function createExportNamedDecls(finalExports: { local: string, exported: string }[]) {
  return j.exportNamedDeclaration(null, finalExports.map(({ local, exported }) => {
    return j.exportSpecifier.from({
      local: j.identifier(local),
      exported: j.identifier(exported)
    });
  }));
}
