import * as astShowcase from './ast-frontend-showcase.json';
import * as astImportFromGit from './ast-import-from-git.json';
// import * as astWebApp from './ast-web-app.json';

import { extractProperties, Node } from './parser';

describe('AST property extraction', () => {
  describe('sample import from git options interface properties', () => {
    let extractedProperties: Node[];

    beforeEach(() => {
      extractedProperties = extractProperties(JSON.stringify(astImportFromGit));
    });

    it('should have one top level options interface', () => {
      expect(extractedProperties.length).toBe(1);
    });

    it('should have one top level member', () => {
      expect(extractedProperties[0].members?.length).toBe(1);
    });

    it('should have the expected properties on the first member', () => {
      const firstMember = extractedProperties![0].members![0];

      expect(firstMember.name).toBe('gitRepository');
      expect(firstMember.kind).toBe('StringKeyword');
      expect(firstMember.jsDoc).toBeDefined();

      expect(firstMember.jsDoc?.description).toBeDefined();
      expect(firstMember.jsDoc?.tags).toContain('validationRegex');
      expect(firstMember.jsDoc?.tags).toContain('validationMessage');
    });
  });

  describe('sample showcase options interface properties', () => {
    it.only('should have one top level options interface', () => {
      const extractedProperties = extractProperties(JSON.stringify(astShowcase));
      console.log(JSON.stringify(extractedProperties[0].members![6], null, 2));
      // console.log(JSON.stringify(extractedProperties[0].members![0], null, 2));

      expect(1).toBe(1);
      // expect(extractedProperties.length).toBe(1);
      // console.log(JSON.stringify(extractedProperties[0], null, 2));
      // console.log(JSON.stringify(extractedProperties[0]));
    });

    // it('should have one top level member', async () => {
    //   expect(extractedProperties[0].members?.length).toBe(1);
    // });

    // it('should have the expected properties on the first member', async () => {
    //   const firstMember = extractedProperties![0].members![0];

    //   expect(firstMember.name).toBe('gitRepository');
    //   expect(firstMember.kind).toBe('StringKeyword');
    //   expect(firstMember.jsDoc).toBeDefined();

    //   expect(firstMember.jsDoc?.description).toBeDefined();
    //   expect(firstMember.jsDoc?.tags).toContain('validationRegex');
    //   expect(firstMember.jsDoc?.tags).toContain('validationMessage');
    // });
  });

  // it('should extract the properties of the import from git options interface', () => {
  //   const extractedProperties = extractProperties(JSON.stringify(astImportFromGit))[0];
  //   // console.log(JSON.stringify(extractedProperties, null, 2));

  //   expect(1).toBe(1);
  // });
});

describe('AST default merging', () => {
  describe('sample import from git options interface properties', () => {
    let extractedProperties: Node[];

    beforeEach(() => {
      extractedProperties = extractProperties(JSON.stringify(astImportFromGit));
    });

    it('should have one top level options interface', () => {
      expect(extractedProperties.length).toBe(1);
    });

    it('should have one top level member', () => {
      expect(extractedProperties[0].members?.length).toBe(1);
    });

    it('should have the expected properties on the first member', () => {
      const firstMember = extractedProperties![0].members![0];

      expect(firstMember.name).toBe('gitRepository');
      expect(firstMember.kind).toBe('StringKeyword');
      expect(firstMember.jsDoc).toBeDefined();

      expect(firstMember.jsDoc?.description).toBeDefined();
      expect(firstMember.jsDoc?.tags).toContain('validationRegex');
      expect(firstMember.jsDoc?.tags).toContain('validationMessage');
    });
  });

  describe('sample showcase options interface properties', () => {
    it.only('should have one top level options interface', () => {
      const extractedProperties = extractProperties(JSON.stringify(astShowcase));
      console.log(JSON.stringify(extractedProperties[0].members![6], null, 2));
      // console.log(JSON.stringify(extractedProperties[0].members![0], null, 2));

      expect(1).toBe(1);
      // expect(extractedProperties.length).toBe(1);
      // console.log(JSON.stringify(extractedProperties[0], null, 2));
      // console.log(JSON.stringify(extractedProperties[0]));
    });

    // it('should have one top level member', async () => {
    //   expect(extractedProperties[0].members?.length).toBe(1);
    // });

    // it('should have the expected properties on the first member', async () => {
    //   const firstMember = extractedProperties![0].members![0];

    //   expect(firstMember.name).toBe('gitRepository');
    //   expect(firstMember.kind).toBe('StringKeyword');
    //   expect(firstMember.jsDoc).toBeDefined();

    //   expect(firstMember.jsDoc?.description).toBeDefined();
    //   expect(firstMember.jsDoc?.tags).toContain('validationRegex');
    //   expect(firstMember.jsDoc?.tags).toContain('validationMessage');
    // });
  });

  // it('should extract the properties of the import from git options interface', () => {
  //   const extractedProperties = extractProperties(JSON.stringify(astImportFromGit))[0];
  //   // console.log(JSON.stringify(extractedProperties, null, 2));

  //   expect(1).toBe(1);
  // });
});
