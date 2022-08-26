import * as astShowcase from '../asts/blueprint-ex/ast-frontend-showcase.json';
import * as astImportFromGit from '../asts/blueprint-ex/ast-import-from-git.json';
import * as astWebApp from '../asts/blueprint-ex/ast-web-app.json';

import { extractProperties, SupportedKind } from '../parser';

describe('Blueprint AST property extraction', () => {
  describe('proper AST of a frontend showcase sample', () => {
    const extractedProperties = extractProperties(JSON.stringify(astShowcase));

    it('should have nine top level options', () => {
      const blueprintInterface = extractedProperties[0];

      //import from git only has input field
      expect(blueprintInterface.members!.length).toBe(9);

      expect(blueprintInterface.members![0].kind).toBe(SupportedKind.TypeReference);
      expect(blueprintInterface.members![0].type).toBe('EnvironmentDefinition');

      expect(blueprintInterface.members![1].kind).toBe(SupportedKind.ArrayType);
      expect(blueprintInterface.members![2].kind).toBe(SupportedKind.StringKeyword);
      expect(blueprintInterface.members![3].kind).toBe(SupportedKind.UnionType);
      expect(blueprintInterface.members![4].kind).toBe(SupportedKind.NumberKeyword);

      expect(blueprintInterface.members![5].kind).toBe(SupportedKind.NumberKeyword);
      expect(blueprintInterface.members![5].optional).toBe(true);

      expect(blueprintInterface.members![6].kind).toBe(SupportedKind.TypeLiteral);
      expect(blueprintInterface.members![7].kind).toBe(SupportedKind.ArrayType);
      expect(blueprintInterface.members![8].kind).toBe(SupportedKind.BooleanKeyword);
    });
  });

  describe('proper AST of a import-from-git sample', () => {
    const extractedProperties = extractProperties(JSON.stringify(astImportFromGit));

    it('should have one top level options interface', () => {
      const blueprintInterface = extractedProperties[0];

      //import from git only has input field
      expect(blueprintInterface.members!.length).toBe(1);

      const input = blueprintInterface.members![0];
      expect(input.kind).toBe(SupportedKind.StringKeyword);
      expect(input.type).toBe(SupportedKind.StringKeyword);
      expect(input.name).toBe('gitRepository');
      expect(input.jsDoc).toBeDefined();
      expect(input.jsDoc!.description).toBeDefined();
      expect(input.jsDoc!.tags!.validationRegex).toBeDefined();
    });
  });

  describe.only('proper AST of a web application sample', () => {
    const extractedProperties = extractProperties(JSON.stringify(astWebApp));
    const blueprintInterface = extractedProperties[0];

    it('should have three top level options', () => {
      expect(blueprintInterface.members?.length).toBe(3);
      expect(blueprintInterface.members![0].kind).toBe(SupportedKind.TypeReference);
      expect(blueprintInterface.members![0].type).toBe('EnvironmentDefinition');

      expect(blueprintInterface.members![1].type).toBe(SupportedKind.TypeLiteral);
      expect(blueprintInterface.members![2].type).toBe(SupportedKind.TypeLiteral);
    });

    it('should ask for an account connection and role on the environment', () => {
      const environment = blueprintInterface.members![0];
      expect(environment.kind).toBe(SupportedKind.TypeReference);
      expect(environment.type).toBe('EnvironmentDefinition');

      expect(environment.members![0].members!.length).toBe(1);
      const accountConnection = environment.members![0].members![0];

      expect(accountConnection.kind).toBe(SupportedKind.TypeReference);
      expect(accountConnection.type).toBe('AccountConnection');

      expect(accountConnection.members![0].members?.length).toBe(1);
      const role = accountConnection.members![0].members![0];
      expect(role.kind).toBe(SupportedKind.TypeReference);
      expect(role.type).toBe('Role');
    });
  });
});
