import Ajv from 'ajv';
import * as yargs from 'yargs';
import * as schema from './__generated__/blueprint-assessment-object-schema.json';
import * as paritalSchema from './__generated__/partial-blueprint-assessment-object-schema.json';

export interface ValidateAssessmentCLIOptions extends yargs.Arguments {
  path: string;
  full: boolean;
}

export interface ValidationResult {
  validationResult: boolean;
  reasons: any[];
}
export const validateAssessment = (
  object: any,
  options: {
    fullSchema: boolean;
  },
): ValidationResult => {
  const ajv = new Ajv();
  let validationResult = false;
  let validationFunction: any = undefined;
  if (options.fullSchema) {
    validationFunction = ajv.compile(schema);
  } else {
    validationFunction = ajv.compile(paritalSchema);
  }
  validationResult = validationFunction(object);
  const reasons = validationFunction.errors || [];
  return {
    validationResult,
    reasons,
  };
};
