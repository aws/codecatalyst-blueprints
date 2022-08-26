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
import * as astWebAppDefaults from './ast/parser/asts/blueprint-ex/ast-web-app-defaults.json';
import * as astWebApp from './ast/parser/asts/blueprint-ex/ast-web-app.json';

import { validateOptions } from './validate-ast';

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
    it('should have no errors', () => {
      const errors = validateOptions(JSON.stringify(astShowcase), astShowcaseDefaults);
      console.log(errors);
      expect(errors.length).toBe(0);
    });
  });

  describe('Example blueprint web app', () => {
    it('should have no errors', () => {
      const errors = validateOptions(JSON.stringify(astWebApp), astWebAppDefaults);
      console.log(errors);
      expect(errors.length).toBe(0);
    });
  });

  describe('Example blueprint import from git', () => {
    it('should have no errors', () => {
      const errors = validateOptions(JSON.stringify(astimportGit), astimportGitDefaults);
      expect(errors.length).toBe(0);
    });
  });
});
