import * as jmesPath from 'jmespath';
import { extractProperties, Node, SupportedKind } from './ast/parser/parser';
import { walk } from './ast/parser/walk';

export interface ValiationError {
  level: 'WARNING' | 'ERROR';

  /**
   * Value that failed
   */
  value: string;

  /**
   * JMES path expression of where the item failed
   */
  location: string;

  /**
   * Failed Regex message
   */
  validationRegex: string;

  /**
   * Failed Regex message
   */
  validationMessage?: string;
}

const VALIDATION_TAG = 'validationRegex';
const VALIDATION_MESSAGE_TAG = 'validationMessage';

/**
 * Takes a string representation of an AST and a string representation of an options json.
 * Attempts to run ast validation on the input json by looking at @validationRegex annotations
 * on the ast and attempting to find those items in the JSON.
 * @param inputAst_ : A string representation of an AST
 * @param options : an object that contains the options Json
 * @returns ValiationError[]: a list of validation errors (if any)
 */
export const validateOptions = (inputAst_: string, options: any): ValiationError[] => {
  const properties = extractProperties(inputAst_);

  let errors: ValiationError[] = [];

  for (const node of walk(properties[0])) {
    const validationRegex = node.jsDoc?.tags![`${VALIDATION_TAG}`];
    if (node.kind == SupportedKind.StringKeyword) {
      let optionValues = jmesPath.search(options, node.path);
      if (optionValues && !Array.isArray(optionValues)) {
        optionValues = [`${optionValues}`];
      }

      const validationResult = validateNode(node, optionValues, validationRegex || '');
      if (validationResult) {
        errors = [...errors, ...validationResult];
      }
    }
  }
  return errors;
};

function validateNode(node: Node, values: string[], regex: string): ValiationError[] {
  if (node.kind != SupportedKind.StringKeyword) {
    throw new Error(`regex validation is not supported on ${node.kind}`);
  }

  const error = {
    location: node.path,
    validationRegex: regex,
  };
  if (!regex) {
    return [
      {
        ...error,
        level: 'ERROR',
        value: '',
        validationMessage: `${SupportedKind.StringKeyword} at ${node.path} should have a @${VALIDATION_TAG} annotation.`,
      },
    ];
  }
  if (regex[0] == '/') {
    regex = regex.slice(1);
  }
  if (regex[regex.length - 1] == '/') {
    regex = regex.slice(0, -1);
  }

  if (!values) {
    return [
      {
        ...error,
        level: 'WARNING',
        value: '',
        validationMessage: `Could not find an element at ${node.path}`,
      },
    ];
  }

  const regexEx = new RegExp(regex);
  const errors: ValiationError[] = [];
  for (const value of values || []) {
    if (!regexEx.test(value)) {
      errors.push({
        ...error,
        value: value,
        level: 'ERROR',
        validationMessage: node.jsDoc?.tags![`${VALIDATION_MESSAGE_TAG}`] || 'Input validation error',
      });
    }
  }
  return errors;
}
