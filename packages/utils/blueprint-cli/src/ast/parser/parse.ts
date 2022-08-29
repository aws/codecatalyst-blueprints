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
import { Node, SupportedKind } from './node';

export const parse = (
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
