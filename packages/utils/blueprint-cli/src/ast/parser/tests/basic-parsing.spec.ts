import * as astBoolean from '../asts/basic/ast-boolean.json';
import * as astLiterial from '../asts/basic/ast-literial.json';
import * as astNumber from '../asts/basic/ast-number.json';
import * as astString from '../asts/basic/ast-string.json';
import * as astUnion from '../asts/basic/ast-union.json';

import { extractProperties, SupportedTypes } from '../parser';

describe('Basic AST type property extraction', () => {
  describe('Boolean AST', () => {
    it('should have the expected properties on the first member', () => {
      const extraction = extractProperties(JSON.stringify(astBoolean));

      expect(extraction[0].members?.length).toBe(1);

      const item = extraction[0].members![0];
      expect(item.kind).toBe(SupportedTypes.BooleanKeyword);
      expect(item.name).toBe('trueCheckbox');
      expect(item.path).toBe(item.name);
    });
  });

  describe('String AST', () => {
    it('should have the expected properties on the first member', () => {
      const extraction = extractProperties(JSON.stringify(astString));

      expect(extraction[0].members?.length).toBe(1);

      const item = extraction[0].members![0];
      expect(item.kind).toBe(SupportedTypes.StringKeyword);
      expect(item.name).toBe('stringfield');
      expect(item.path).toBe(item.name);
    });
  });

  describe('Number AST', () => {
    it('should have the expected properties on the first member', () => {
      const extraction = extractProperties(JSON.stringify(astNumber));
      expect(extraction[0].members?.length).toBe(1);

      const item = extraction[0].members![0];
      expect(item.kind).toBe(SupportedTypes.NumberKeyword);
      expect(item.name).toBe('numberfield');
      expect(item.path).toBe(item.name);

      expect(1).toBe(1);
    });
  });

  describe('Literial AST', () => {
    it('should have the expected properties on the first member', () => {
      const extraction = extractProperties(JSON.stringify(astLiterial));
      expect(extraction[0].members?.length).toBe(1);
      const item = extraction[0].members![0];
      // console.log(item);
      expect(item.kind).toBe(SupportedTypes.LiteralType);
      expect(item.name).toBe('literial');
      expect(item.path).toBe(item.name);
      expect(item.jsDoc).toBeDefined();
    });
  });

  describe('Union AST', () => {
    it('should have the expected properties on the first member', () => {
      const extraction = extractProperties(JSON.stringify(astUnion));
      expect(extraction[0].members?.length).toBe(1);

      const union = extraction[0].members![0];
      expect(union.kind).toBe(SupportedTypes.UnionType);
      expect(union.name).toBe('unionfield');
      expect(union.path).toBe(union.name);

      expect(union.members?.length).toBe(3);
      for (const member of union.members!) {
        expect(member.kind).toBe(SupportedTypes.LiteralType);
        expect(member.jsDoc).toBeUndefined();
      }

      const firstLiteralElement = union.members![0];
      expect(firstLiteralElement.type).toBe('StringLiteral');
      expect(firstLiteralElement.value).toBe('A');
    });
  });
});
