// import * as astComplexArray from '../asts/arrays/ast-array-complex.json';
// import * as astStringArray from '../asts/arrays/ast-array-string.json';
import * as astNestedObject from '../asts/objects/ast-object-nested.json';
import * as astTupleLiteral from '../asts/objects/ast-tuple-literial.json';
import * as astTupleStringNumber from '../asts/objects/ast-tuple-string-number.json';
import * as astTypeReference from '../asts/objects/ast-typereference.json';

import { extractProperties, SupportedTypes } from '../parser';

describe('Object AST type property extraction', () => {
  describe('Nested Object AST', () => {
    it('should have the expected properties on the first member', () => {
      const extraction = extractProperties(JSON.stringify(astNestedObject));
      expect(extraction[0].members?.length).toBe(1);

      const item = extraction[0].members![0];
      expect(item.kind).toBe(SupportedTypes.TypeLiteral);
      expect(item.name).toBe('nested');
      expect(item.path).toBe(item.name);
      expect(item.members?.length).toBe(4);

      //expect the last member to be yet another nested element
      const lastElement = item.members![3];
      expect(lastElement.kind).toBe(SupportedTypes.TypeLiteral);
      expect(lastElement.name).toBe('nestedNest');
      expect(lastElement.path).toBe([item.path, lastElement.name].join('.'));
      expect(lastElement.members?.length).toBe(2);

      const subNestedString = lastElement.members![0];
      expect(subNestedString.kind).toBe(SupportedTypes.StringKeyword);
      expect(subNestedString.name).toBe('stringField');
      expect(lastElement.path).toBe([lastElement.path, subNestedString.name].join('.'));
    });
  });

  describe('String Tuple of literials AST', () => {
    it('should have the expected properties on the first member', () => {
      const extraction = extractProperties(JSON.stringify(astTupleLiteral));
      expect(extraction[0].members?.length).toBe(1);

      const item = extraction[0].members![0];
      expect(item.kind).toBe(SupportedTypes.TupleType);
      expect(item.name).toBe('literialTuple');
      expect(item.path).toBe(item.name);
      expect(item.jsDoc).toBeDefined();
      expect(item.members?.length).toBe(2);

      for (const element of item.members!) {
        expect(element.kind).toBe(SupportedTypes.LiteralType);
        expect(element.type).toBe('StringLiteral');
        expect(element.value).toBeDefined();
      }
    });
  });

  describe.only('Tuple of objects AST', () => {
    it('should have the expected properties on the first member', () => {
      const extraction = extractProperties(JSON.stringify(astTupleStringNumber));
      expect(extraction[0].members?.length).toBe(1);

      const item = extraction[0].members![0];
      console.log(item);
      expect(item.kind).toBe(SupportedTypes.TupleType);
      expect(item.name).toBe('stringNumberTuple');
      expect(item.path).toBe(item.name);
      expect(item.jsDoc).toBeDefined();
      expect(item.members?.length).toBe(2);

      const stringElement = item.members![0];
      expect(stringElement.kind).toBe(SupportedTypes.StringKeyword);
      expect(stringElement.type).toBe(SupportedTypes.StringKeyword);
      expect(stringElement.name).toBe(undefined);
      expect(stringElement.path).toBe('stringNumberTuple[0]');

      const numberElement = item.members![1];
      expect(numberElement.kind).toBe(SupportedTypes.NumberKeyword);
      expect(numberElement.type).toBe(SupportedTypes.NumberKeyword);
      expect(stringElement.name).toBe(undefined);
      expect(stringElement.path).toBe('stringNumberTuple[0]');
    });
  });

  describe.only('Tuple of objects AST', () => {
    it('should have the expected properties on the first member', () => {
      const extraction = extractProperties(JSON.stringify(astTupleStringNumber));
      expect(extraction[0].members?.length).toBe(1);

      const item = extraction[0].members![0];
      expect(item.kind).toBe(SupportedTypes.TupleType);
      expect(item.name).toBe('stringNumberTuple');
      expect(item.path).toBe(item.name);
      expect(item.jsDoc).toBeDefined();
      expect(item.members?.length).toBe(2);

      const stringElement = item.members![0];
      expect(stringElement.kind).toBe(SupportedTypes.StringKeyword);
      expect(stringElement.type).toBe(SupportedTypes.StringKeyword);
      expect(stringElement.name).toBe(undefined);
      expect(stringElement.path).toBe('stringNumberTuple[0]');

      const numberElement = item.members![1];
      expect(numberElement.kind).toBe(SupportedTypes.NumberKeyword);
      expect(numberElement.type).toBe(SupportedTypes.NumberKeyword);
      expect(stringElement.name).toBe(undefined);
      expect(stringElement.path).toBe('stringNumberTuple[0]');
    });
  });

  describe.only('Typereference object AST', () => {
    it('should have the expected properties on the first member', () => {
      const extraction = extractProperties(JSON.stringify(astTypeReference));
      expect(extraction[0].members?.length).toBe(1);

      const item = extraction[0].members![0];
      console.log(item);
      // expect(item.kind).toBe(SupportedTypes.TupleType);
      // expect(item.name).toBe('stringNumberTuple');
      // expect(item.path).toBe(item.name);
      // expect(item.jsDoc).toBeDefined();
      // expect(item.members?.length).toBe(2);

      // const stringElement = item.members![0];
      // expect(stringElement.kind).toBe(SupportedTypes.StringKeyword);
      // expect(stringElement.type).toBe(SupportedTypes.StringKeyword);
      // expect(stringElement.name).toBe(undefined);
      // expect(stringElement.path).toBe('stringNumberTuple[0]');

      // const numberElement = item.members![1];
      // expect(numberElement.kind).toBe(SupportedTypes.NumberKeyword);
      // expect(numberElement.type).toBe(SupportedTypes.NumberKeyword);
      // expect(stringElement.name).toBe(undefined);
      // expect(stringElement.path).toBe('stringNumberTuple[0]');
    });
  });
});
