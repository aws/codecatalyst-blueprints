import { JsDoc } from './extract-js-doc';

/**
 * Types we've build parsing support for
 */
export enum SupportedKind {
  'InterfaceDeclaration' = 'InterfaceDeclaration',

  'TypeLiteral' = 'TypeLiteral',
  'TypeReference' = 'TypeReference',
  'StringKeyword' = 'StringKeyword',
  'NumberKeyword' = 'NumberKeyword',
  'UnionType' = 'UnionType',
  'ArrayType' = 'ArrayType',
  'BooleanKeyword' = 'BooleanKeyword',
  'TupleType' = 'TupleType',
  'LiteralType' = 'LiteralType',
}

export interface Node {
  /**
   * The kind of AST Node
   */
  kind: SupportedKind;

  /**
   * The underlying type information. Typically is or is a specification on the kind.
   */
  type: string;

  /**
   * The name of the node in the interface. Not all types have names, e.g. inline types
   */
  name?: string;

  /**
   * jmesPath expression to the location of this element in a valid JSON representation of the underlying type
   * See: https://jmespath.org/
   */
  path: string;

  /**
   * The value this node has taken
   * Typically this does not come from the AST (except for literal types)
   */
  value?: string;

  optional: boolean;
  jsDoc?: JsDoc;
  members?: Node[];
}
