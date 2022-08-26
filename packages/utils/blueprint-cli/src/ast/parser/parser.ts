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
  kind: SupportedTypes;

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
    searchType?: SupportedTypes;
    /**
     * The name of the type we;re looking for
     * e.g. 'Options'
     */
    searchName?: string;
  },
): Node[] => {
  const search = {
    searchType: SupportedTypes.InterfaceDeclaration.toString(),
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

// export const joinDefaults = (ast: any, defaults: any): Node[] => {
//   return [];
// };

/**
 * Types we've build parsing support for
 */
export enum SupportedTypes {
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
    case SupportedTypes.InterfaceDeclaration:
      return handleInterfaceDeclaration(property, path);
    case SupportedTypes.TypeLiteral:
      return handleTypeLiteral(property, path);
    case SupportedTypes.TypeReference:
      return handleTypeReference(property, path);
    case SupportedTypes.StringKeyword:
      return handleStringKeyword(property, path);
    case SupportedTypes.NumberKeyword:
      return handleNumberKeyword(property, path);
    case SupportedTypes.UnionType:
      return handleUnionType(property, path);
    case SupportedTypes.ArrayType:
      return handleArrayType(property, path);
    case SupportedTypes.BooleanKeyword:
      return handleBooleanKeyword(property, path);
    case SupportedTypes.TupleType:
      return handleTupleType(property, path);
    case SupportedTypes.LiteralType:
      return handleLiteralType(property, path);
    default:
      throw `unsupported kind ${property.kind}; ${JSON.stringify(property)}`;
      break;
  }
  return {} as Node;
};
