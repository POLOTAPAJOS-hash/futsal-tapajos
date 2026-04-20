import * as fs from 'fs';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

const code = fs.readFileSync('app/page.tsx', 'utf-8');
const ast = parse(code, {
  sourceType: 'module',
  plugins: ['jsx', 'typescript']
});

traverse(ast, {
  JSXElement(path) {
    if (path.node.openingElement.name.type === 'JSXIdentifier' && path.node.openingElement.name.name === 'input') {
      const cls = path.node.openingElement.attributes.find(a => a.name && a.name.name === 'className');
      const val = cls && cls.value && cls.value.value ? cls.value.value : '';
      const typeAttr = path.node.openingElement.attributes.find(a => a.name && a.name.name === 'type');
      const type = typeAttr && typeAttr.value && typeAttr.value.value ? typeAttr.value.value : '';
      const valAttr = path.node.openingElement.attributes.find(a => a.name && a.name.name === 'value');
      let valStr = '';
      if (valAttr && valAttr.value && valAttr.value.type === 'JSXExpressionContainer') {
        const expr = valAttr.value.expression;
        if (expr.type === 'MemberExpression') {
          valStr = (expr.object.name || (expr.object.property && expr.object.property.name)) + '.' + expr.property.name;
        } else if (expr.type === 'Identifier') {
          valStr = expr.name;
        } else {
            valStr = expr.type;
        }
      }
      console.log(`Input class=${val} type=${type} value=${valStr} start=${path.node.loc?.start.line}`);
    }
  }
});
