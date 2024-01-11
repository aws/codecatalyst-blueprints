import * as stringArrayInvalidDefaults from './ast/parser/asts/arrays/ast-array-string-defaults-invalid.json';
import * as stringArrayValidDefaults from './ast/parser/asts/arrays/ast-array-string-defaults-valid.json';
import * as astStringArray from './ast/parser/asts/arrays/ast-array-string.json';

import * as stringInvalidDefaults from './ast/parser/asts/basic/ast-string-defaults-invalid.json';
import * as stringValidDefaults from './ast/parser/asts/basic/ast-string-defaults-valid.json';
import * as astString from './ast/parser/asts/basic/ast-string.json';

import * as astShowcaseDefaults from './ast/parser/asts/blueprint-ex/ast-frontend-showcase-defaults.json';
import * as astShowcase from './ast/parser/asts/blueprint-ex/ast-frontend-showcase.json';
import * as astimportGitDefaults from './ast/parser/asts/blueprint-ex/ast-import-from-git-defaults.json';
import * as astimportGit from './ast/parser/asts/blueprint-ex/ast-import-from-git.json';
import * as astTupleDefaults from './ast/parser/asts/blueprint-ex/ast-tuple-blueprint-defaults.json';
import * as astTuple from './ast/parser/asts/blueprint-ex/ast-tuple-blueprint.json';
import * as astWebAppDefaults from './ast/parser/asts/blueprint-ex/ast-web-app-defaults.json';
import * as astWebApp from './ast/parser/asts/blueprint-ex/ast-web-app.json';

import { validateOptions } from './validate-options';

describe('Verifies that properties on an AST pass the @validation regex', () => {
  describe('Strings that pass validation', () => {
    it('should not have any errors', () => {
      const errors = validateOptions(JSON.stringify(astString), stringValidDefaults);
      expect(errors.length).toBe(0);
    });
  });

  describe('Strings that dont pass validation', () => {
    it('should have one any errors on the item', () => {
      const errors = validateOptions(JSON.stringify(astString), stringInvalidDefaults);

      expect(errors.length).toBe(1);
      expect(errors[0].location).toBe('stringInput');
      expect(errors[0].level).toBe('ERROR');
      expect(errors[0].validationRegex).toBeDefined();
      expect(errors[0].validationMessage).toBeDefined();
    });
  });

  describe('Arrays of strings that pass validation', () => {
    it('should have the expected properties on the first member', () => {
      const errors = validateOptions(JSON.stringify(astStringArray), stringArrayValidDefaults);
      expect(errors.length).toBe(0);
    });
  });

  describe('Arrays of strings that do not pass validation', () => {
    it('should have an error on all 4 invalid errors', () => {
      const errors = validateOptions(JSON.stringify(astStringArray), stringArrayInvalidDefaults);
      expect(errors.length).toBe(4);
    });
  });

  describe('Example blueprint frontend-showcase', () => {
    it('should have one warning message and one error message', () => {
      const errors = validateOptions(JSON.stringify(astShowcase), astShowcaseDefaults);

      // should have one warning about could not find element
      expect(errors.length).toBe(2);

      // there's no value for a possibly empty object
      expect(errors[0].level).toBe('WARNING');
      expect(errors[0].location).toBe('nestedArea.emptyInput');
      expect(errors[0].validationMessage).toBe('Could not find an element at nestedArea.emptyInput');

      // there's no validation message on a string array
      expect(errors[1].level).toBe('ERROR');
      expect(errors[1].location).toBe('stringListInput[*]');
      expect(errors[1].validationMessage?.length).toBeGreaterThan(1);
    });
  });

  describe('Example blueprint web app', () => {
    it('should have no errors', () => {
      const errors = validateOptions(JSON.stringify(astWebApp), astWebAppDefaults);
      expect(errors.length).toBe(0);
    });
  });

  describe('Example blueprint import from git', () => {
    it('should have no errors', () => {
      const errors = validateOptions(JSON.stringify(astimportGit), astimportGitDefaults);
      expect(errors.length).toBe(0);
    });
  });

  describe('Example blueprint tuple', () => {
    it('should have no errors', () => {
      const errors = validateOptions(JSON.stringify(astTuple), astTupleDefaults);
      expect(errors.filter(err => err.level == 'ERROR').length).toBe(0);
    });
  });
});
