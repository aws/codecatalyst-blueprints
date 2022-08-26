import { JsDoc } from './extract-js-doc';
import {
  handleArrayType,
  handleBooleanKeyword,
  handleInterfaceDeclaration,
  handleLiteralType,
  handleNumberKeyword,
  handleStringKeyword,
  handleTupleType,
  handleTypeLiteral,
  handleTypeReference,
  handleUnionType,
} from './handle-declaration';

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

export const extractProperties = (
  ast_: string,
  options?: {
    /**
     * The type of the type we're looking for
     * e.g. 'InterfaceDeclaration'
     */
    searchType?: SupportedKind;
    /**
     * The name of the type we;re looking for
     * e.g. 'Options'
     */
    searchName?: string;
  },
): Node[] => {
  const search = {
    searchType: SupportedKind.InterfaceDeclaration.toString(),
    searchName: 'Options',
    ...options,
  };

  const ast = JSON.parse(ast_);
  const nodes: Node[] = [];
  (ast.statements || []).forEach((statement: any) => {
    if (statement.kind == search.searchType && statement.name?.escapedText == search.searchName) {
      // Found the AST entry property we're looking for
      const node = convertToNode(statement, '');
      node && nodes.push(node);
    }
  });
  // AST has no interface matching what we're looking for
  return nodes;
};

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

export const convertToNode = (property: any, path: string): Node => {
  // attempt to get the type of the node
  const nodeType = property.type?.kind || property.kind;
  switch (nodeType) {
    case SupportedKind.InterfaceDeclaration:
      return handleInterfaceDeclaration(property, path);
    case SupportedKind.TypeLiteral:
      return handleTypeLiteral(property, path);
    case SupportedKind.TypeReference:
      return handleTypeReference(property, path);
    case SupportedKind.StringKeyword:
      return handleStringKeyword(property, path);
    case SupportedKind.NumberKeyword:
      return handleNumberKeyword(property, path);
    case SupportedKind.UnionType:
      return handleUnionType(property, path);
    case SupportedKind.ArrayType:
      return handleArrayType(property, path);
    case SupportedKind.BooleanKeyword:
      return handleBooleanKeyword(property, path);
    case SupportedKind.TupleType:
      return handleTupleType(property, path);
    case SupportedKind.LiteralType:
      return handleLiteralType(property, path);
    default:
      throw `unsupported kind ${property.kind}; ${JSON.stringify(property)}`;
  }
};
