// import * as astComplexArray from '../asts/arrays/ast-array-complex.json';
// import * as astStringArray from '../asts/arrays/ast-array-string.json';
import * as astNestedObject from '../asts/objects/ast-object-nested.json';
import * as astTupleLiteral from '../asts/objects/ast-tuple-literial.json';
import * as astTupleStringNumber from '../asts/objects/ast-tuple-string-number.json';
import * as astTypeReference from '../asts/objects/ast-typereference.json';

import { extractProperties, SupportedKind } from '../parser';

describe('Object AST type property extraction', () => {
  describe('Nested Object AST', () => {
    const extraction = extractProperties(JSON.stringify(astNestedObject));

    it('should have the expected properties on the first member', () => {
      expect(extraction[0].members?.length).toBe(1);

      const item = extraction[0].members![0];
      expect(item.kind).toBe(SupportedKind.TypeLiteral);
      expect(item.name).toBe('nested');
      expect(item.path).toBe(item.name);
      expect(item.members?.length).toBe(4);

      //expect the last member to be yet another nested element
      const lastElement = item.members![3];
      expect(lastElement.kind).toBe(SupportedKind.TypeLiteral);
      expect(lastElement.name).toBe('nestedNest');
      expect(lastElement.path).toBe([item.path, lastElement.name].join('.'));
      expect(lastElement.members?.length).toBe(2);

      const subNestedString = lastElement.members![0];
      expect(subNestedString.kind).toBe(SupportedKind.StringKeyword);
      expect(subNestedString.name).toBe('stringField');
      expect(subNestedString.path).toBe([lastElement.path, subNestedString.name].join('.'));
    });
  });

  describe('String Tuple of literials AST', () => {
    const extraction = extractProperties(JSON.stringify(astTupleLiteral));

    it('should have the expected properties on the first member', () => {
      expect(extraction[0].members?.length).toBe(1);

      const item = extraction[0].members![0];
      expect(item.kind).toBe(SupportedKind.TupleType);
      expect(item.name).toBe('literialTuple');
      expect(item.path).toBe(item.name);
      expect(item.jsDoc).toBeDefined();
      expect(item.members?.length).toBe(2);
    });

    it('should have literal subelements', () => {
      for (const element of extraction[0].members![0].members!) {
        expect(element.kind).toBe(SupportedKind.LiteralType);
        expect(element.type).toBe('StringLiteral');
        expect(element.value).toBeDefined();
      }
    });
  });

  describe('Tuple of objects AST', () => {
    const extraction = extractProperties(JSON.stringify(astTupleStringNumber));

    it('should have the expected properties on the first member', () => {
      expect(extraction[0].members?.length).toBe(1);
      const item = extraction[0].members![0];
      expect(item.kind).toBe(SupportedKind.TupleType);
      expect(item.name).toBe('stringNumberTuple');
      expect(item.path).toBe(item.name);
      expect(item.jsDoc).toBeDefined();
      expect(item.members?.length).toBe(2);
    });

    it('should have a string as the first member', () => {
      const stringElement = extraction[0].members![0].members![0];
      expect(stringElement.kind).toBe(SupportedKind.StringKeyword);
      expect(stringElement.type).toBe(SupportedKind.StringKeyword);
      expect(stringElement.name).toBe(undefined);
      expect(stringElement.path).toBe('stringNumberTuple[0]');
    });

    it('should have a number as the second member', () => {
      const numberElement = extraction[0].members![0].members![1];
      expect(numberElement.kind).toBe(SupportedKind.NumberKeyword);
      expect(numberElement.type).toBe(SupportedKind.NumberKeyword);
      expect(numberElement.name).toBe(undefined);
      expect(numberElement.path).toBe('stringNumberTuple[1]');
    });
  });

  describe('Typereference object AST', () => {
    const extraction = extractProperties(JSON.stringify(astTypeReference));

    it('should have the expected properties on the first member', () => {
      expect(extraction[0].members?.length).toBe(1);

      const item = extraction[0].members![0];
      expect(item.kind).toBe(SupportedKind.TypeReference);
      expect(item.type).toBe('SomeTypeReference');
      expect(item.name).toBe('literial');
      expect(item.path).toBe('literial');
    });
  });
});
