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
} from './handleDeclaration';

export interface JsDoc {
  description?: string;
  tags?: { [key: string]: string };
}

export interface Node {
  /**
   * The kind of AST Node
   */
  kind: SupportedTypes;

  /**
   * The underlying type information
   */
  type: string;

  /**
   * The name of the node in the interface
   */
  name: string;

  /**
   * Default value of the node (if there is one)
   */
  value?: string;

  optional: boolean;
  jsDoc?: JsDoc;
  members?: Node[];
}

export const extractProperties = (
  ast_: any,
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
      const node = convertToNode(statement);
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

export const convertToNode = (property: any): Node => {
  // attempt to get the type of the node
  const nodeType = property.type?.kind || property.kind;
  switch (nodeType) {
    case SupportedTypes.InterfaceDeclaration:
      return handleInterfaceDeclaration(property);
    case SupportedTypes.TypeLiteral:
      return handleTypeLiteral(property);
    case SupportedTypes.TypeReference:
      return handleTypeReference(property);
    case SupportedTypes.StringKeyword:
      return handleStringKeyword(property);
    case SupportedTypes.NumberKeyword:
      return handleNumberKeyword(property);
    case SupportedTypes.UnionType:
      return handleUnionType(property);
    case SupportedTypes.ArrayType:
      return handleArrayType(property);
    case SupportedTypes.BooleanKeyword:
      return handleBooleanKeyword(property);
    case SupportedTypes.TupleType:
      return handleTupleType(property);
    case SupportedTypes.LiteralType:
      return handleLiteralType(property);
    default:
      throw `unsupported kind ${property.kind}; ${JSON.stringify(property)}`;
      break;
  }
  return {} as Node;
};
