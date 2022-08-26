import * as jmesPath from 'jmespath';
import { extractProperties, Node, SupportedTypes } from './ast/parser/parser';
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
 */
export const validate = (inputAst_: string, options_: string): ValiationError[] => {
  const properties = extractProperties(inputAst_);
  const errors: ValiationError[] = [];

  for (const node of walk(properties[0])) {
    const validationRegex = node.jsDoc?.tags![`${VALIDATION_TAG}`];
    if (validationRegex) {
      const optionValue = jmesPath.search(options_, node.path);
      const validationResult = validateNode(node, optionValue, validationRegex);
      if (validationResult) {
        errors.push(validationResult);
      }
    }
  }
  return errors;
};

function validateNode(node: Node, value: any, regex: string): ValiationError | undefined {
  const error = {
    location: node.path,
    validationRegex: regex,
  };

  if (!value) {
    return {
      ...error,
      level: 'WARNING',
      value: '',
      validationMessage: `Could not find an element at ${node.path}`,
    };
  }

  // The types that we support regex validation over
  if (
    // support regex validation on string
    node.kind == SupportedTypes.StringKeyword ||
    // support regex validation on string[]
    (node.kind == SupportedTypes.ArrayType && node.type == SupportedTypes.StringKeyword)
  ) {
    const elements = [];
    if (node.kind == SupportedTypes.StringKeyword) {
      if (!new RegExp(regex).test(value)) {
        return {
          ...error,
          level: 'ERROR',
          validationMessage: node.jsDoc?.tags![`${VALIDATION_MESSAGE_TAG}`],
        };
      }
    }
  } else {
    return {
      ...error,
      level: 'WARNING',
      validationMessage: `Found a validation tag on ${node.path} [${node.name}] but validation is not supported on AST type ${node.type}`,
    };
  }
  return undefined;
}
