import * as astStringArray from './asts/arrays/ast-array-string.json';

import { extractProperties, Node, SupportedKind } from './parser';
import { walk } from './walk';

describe('AST walking', () => {
  describe('Depth first walking', () => {
    it('should have walk the elements on the AST', () => {
      const elements: Node[] = [];
      for (const node of walk(extractProperties(JSON.stringify(astStringArray))[0])) {
        elements.push(node);
      }

      expect(elements[0].kind).toBe(SupportedKind.InterfaceDeclaration);
      expect(elements[1].kind).toBe(SupportedKind.ArrayType);
      expect(elements[2].kind).toBe(SupportedKind.StringKeyword);
    });
  });
});
