import * as astComplexArray from '../asts/arrays/ast-array-complex.json';
import * as astStringArray from '../asts/arrays/ast-array-string.json';

import { SupportedKind } from '../node';
import { parse } from '../parse';

describe('Arrays AST type property extraction', () => {
  describe('String Array AST', () => {
    it('should have the expected properties on the first member', () => {
      const extraction = parse(JSON.stringify(astStringArray));
      expect(extraction[0].members?.length).toBe(1);
      const item = extraction[0].members![0];
      expect(item.kind).toBe(SupportedKind.ArrayType);
      expect(item.type).toBe('StringKeyword');
      expect(item.name).toBe('stringArray');
      expect(item.path).toBe('stringArray[*]');
      expect(item.jsDoc).toBeDefined();

      expect(item.members?.length).toBe(1);
      expect(item.members![0].kind).toBe(SupportedKind.StringKeyword);
      expect(item.members![0].path).toBe('stringArray[*]');
      expect(item.members![0].jsDoc).toBeDefined();
    });
  });

  describe('Complex Array AST', () => {
    it('should have the expected properties on the first member', () => {
      const extraction = parse(JSON.stringify(astComplexArray));
      expect(extraction[0].members?.length).toBe(1);

      const item = extraction[0].members![0];

      expect(item.kind).toBe(SupportedKind.ArrayType);
      expect(item.type).toBe(SupportedKind.TypeLiteral);
      expect(item.name).toBe('complexArray');
      expect(item.jsDoc).toBeDefined();
      expect(item.path).toBe('complexArray[*]');
      expect(item.members?.length).toBe(1);

      const arrayType = item.members![0];
      expect(arrayType.kind).toBe(SupportedKind.TypeLiteral);
      expect(arrayType.jsDoc).toBe(item.jsDoc);

      expect(arrayType.members?.length).toBe(2);

      const stringfield = arrayType.members![0]!;
      expect(stringfield.kind).toBe(SupportedKind.StringKeyword);
      expect(stringfield.name).toBe('aStringField');
      expect(stringfield.path).toBe('complexArray[*].aStringField');

      const numberfield = arrayType.members![1];
      expect(numberfield.kind).toBe(SupportedKind.NumberKeyword);
      expect(numberfield.name).toBe('aNumberField');
      expect(numberfield.path).toBe('complexArray[*].aNumberField');
    });
  });
});
