import j from 'jscodeshift';

// exports.identifier = ANYTHING
export function getExportsDotIdentifiers(
  root: j.Collection<j.Program>,
  name: string = 'exports'
): j.Collection<j.ExpressionStatement> {
  return root.find(j.ExpressionStatement, {
    expression: {
      type: 'AssignmentExpression',
      operator: '=',
      left: {
        type: 'MemberExpression',
        object: { type: 'Identifier', name: name },
        property: { type: 'Identifier' }
      },
    }
  });
}

// const alias = exports;
export function getNormalExportAlias(
  root: j.Collection<j.Program>,
  name: string = 'exports'
): j.Collection<j.VariableDeclaration> {
  return root.find(j.VariableDeclaration, {
    kind: 'const',
    declarations: [{
      type: 'VariableDeclarator',
      id: { type: 'Identifier' },
      init: {
        type: 'Identifier',
        name: name
      }
    }]
  });
}

// exports = alias;
export function getBadExport(
  root: j.Collection<j.Program>,
  name: string = 'exports'
): j.Collection<j.ExpressionStatement> {
  return root.find(j.ExpressionStatement, {
    expression: {
      type: 'AssignmentExpression',
      left: {
        type: 'Identifier',
        name: name
      }
    }
  });
}

// module.exports = alias as j.Identifier;
export function getModuleExports(
  root: j.Collection<j.Program>,
): j.Collection<j.ExpressionStatement> {
  return root.find(j.ExpressionStatement, {
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
}
