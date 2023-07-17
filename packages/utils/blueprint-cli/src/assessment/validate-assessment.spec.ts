import emptyAssessmentOverride from './example-assessments/empty-assessment-override.json';
import invalidAssessmentOverride from './example-assessments/invalid-assessment-override.json';
import invalidAssessment from './example-assessments/invalid-full-assessment.json';
import invalidPartialAssessment from './example-assessments/invalid-partial-assessment.json';
import validAssessment from './example-assessments/valid-full-assessment.json';
import validPartialAssessment from './example-assessments/valid-partial-assessment.json';

import { validateAssessment } from './validate-assessment';

describe(validateAssessment.name, () => {
  describe('Partial Assessment validation', () => {
    it('should validate a valid partial assessment', () => {
      const { reasons, validationResult } = validateAssessment(validPartialAssessment, {
        fullSchema: false,
      });
      expect(reasons).toEqual([]);
      expect(validationResult).toBe(true);
    });

    it('should invalidate a invalid partial assessment', () => {
      const { reasons, validationResult } = validateAssessment(invalidPartialAssessment, {
        fullSchema: false,
      });
      expect(reasons).toEqual([
        {
          instancePath: '',
          keyword: 'additionalProperties',
          message: 'must NOT have additional properties',
          params: {
            additionalProperty: 'someKeyThatIsUnsupported',
          },
          schemaPath: '#/additionalProperties',
        },
      ]);
      expect(validationResult).toBe(false);
    });
  });

  describe('Full Assessment validation', () => {
    it('should validate a valid assessment', () => {
      const { reasons, validationResult } = validateAssessment(validAssessment, {
        fullSchema: true,
      });
      expect(reasons).toEqual([]);
      expect(validationResult).toBe(true);
    });

    it('should invalidate a invalid assessment', () => {
      const { reasons, validationResult } = validateAssessment(invalidAssessment, {
        fullSchema: true,
      });
      expect(reasons).toEqual([
        {
          instancePath: '',
          keyword: 'required',
          message: "must have required property 'schedule'",
          params: {
            missingProperty: 'schedule',
          },
          schemaPath: '#/required',
        },
      ]);
      expect(validationResult).toBe(false);
    });
  });

  describe.only('Assessment override validation', () => {
    it('should allow an empty assessment as a valid partial assessment', () => {
      const { reasons, validationResult } = validateAssessment(emptyAssessmentOverride, {
        fullSchema: false,
      });
      expect(reasons).toEqual([]);
      expect(validationResult).toBe(true);
    });

    it('should not allow an empty assessment as a full assessment', () => {
      const { reasons, validationResult } = validateAssessment(emptyAssessmentOverride, {
        fullSchema: true,
      });
      expect(reasons).toEqual([
        {
          instancePath: '',
          keyword: 'required',
          message: "must have required property 'spaceName'",
          params: {
            missingProperty: 'spaceName',
          },
          schemaPath: '#/required',
        },
      ]);
      expect(validationResult).toBe(false);
    });

    it('should invalidate an invalid override', () => {
      const { reasons, validationResult } = validateAssessment(invalidAssessmentOverride, {
        fullSchema: false,
      });
      expect(reasons).toEqual([
        {
          instancePath: '',
          keyword: 'additionalProperties',
          message: 'must NOT have additional properties',
          params: {
            additionalProperty: 'AnUnsupportedOption',
          },
          schemaPath: '#/additionalProperties',
        },
      ]);
      expect(validationResult).toBe(false);
    });
  });
});
