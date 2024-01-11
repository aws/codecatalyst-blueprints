import { extractJsdoc } from './extract-js-doc';
import { Node } from './node';
import { convertToNode } from './parse';

const isOptional = (property): boolean => {
  return property.questionToken ? true : false;
};

export const handleArrayType = (property, path: string): Node => {
  const node: Node = {
    kind: property.type?.kind,
    type: property.type?.elementType?.kind,
    name: property.name?.escapedText,
    optional: isOptional(property),
    jsDoc: extractJsdoc(property.jsDoc),
    path: `${[path, property.name?.escapedText].filter(i => i?.length).join('.')}[*]`,
  };

  node.members = [
    {
      ...convertToNode(property.type?.elementType, node.path),
      jsDoc: node.jsDoc,
    },
  ];
  return node;
};

export const handleTupleType = (property, path: string): Node => {
  const node: Node = {
    kind: property.type?.kind || property.kind,
    type: property.type?.kind || property.kind,
    name: property.name?.escapedText,
    optional: isOptional(property),
    jsDoc: extractJsdoc(property.jsDoc),
    path: [path, property.name?.escapedText].filter(i => i?.length).join('.'),
  };

  node.members = (property.elements || property.type?.elements || []).map((element, index) => {
    return convertToNode(
      {
        questionToken: property.questionToken,
        jsDoc: property.jsDoc,
        ...element,
      },
      `${node.path}[${index}]`,
    );
  });
  return node;
};

export const handleLiteralType = (property, path: string): Node => {
  let node: Node;
  if (property.type) {
    node = {
      ...handleLiteralType(property.type, path),
      name: property.name?.escapedText,
      jsDoc: extractJsdoc(property.jsDoc),
    };
    node.path = [path, node.name].filter(i => i?.length).join('.');
  } else {
    node = {
      kind: property.kind,
      type: property.literal?.kind,
      name: property.name?.escapedText,
      value: property.literal?.text,
      optional: isOptional(property),
      jsDoc: extractJsdoc(property.jsDoc),
      path,
    };
  }

  node.path = [path, node.name].filter(i => i?.length).join('.');
  return node;
};

export const handleInterfaceDeclaration = (property, path: string): Node => {
  const node: Node = {
    kind: property.kind,
    type: property.kind,
    name: property.name?.escapedText,
    optional: isOptional(property),
    jsDoc: extractJsdoc(property.jsDoc),
    path: path,
  };
  node.members = (property.members || []).map(subProperty => convertToNode(subProperty, path));
  return node;
};

export const handleTypeReference = (property, path: string): Node => {
  const node: Node = {
    kind: property.type?.kind,
    type: property.type?.typeName?.escapedText,
    name: property.name?.escapedText,
    optional: isOptional(property),
    jsDoc: extractJsdoc(property.jsDoc),
    path: [path, property.name?.escapedText].filter(i => i?.length).join('.'),
  };

  node.members = (property.type?.typeArguments || []).map(typeArgument => {
    return convertToNode(
      {
        questionToken: property.questionToken,
        jsDoc: property.jsDoc,
        ...typeArgument,
      },
      node.path,
    );
  });
  return node;
};

export const handleUnionType = (property, path: string): Node => {
  const node: Node = {
    kind: property.type?.kind,
    type: property.type?.kind,
    name: property.name?.escapedText,
    optional: isOptional(property),
    jsDoc: extractJsdoc(property.jsDoc),
    path: [path, property.name?.escapedText].filter(i => i?.length).join('.'),
  };

  node.members = (property.type?.types || []).map(subProperty => convertToNode(subProperty, node.path));
  return node;
};

/**
 * A literal inline type. This is typically a nested type
 * @param property
 * @returns
 */
export const handleTypeLiteral = (property, path: string): Node => {
  const node: Node = {
    kind: property.type?.kind || property.kind,
    type: property.type?.kind || property.kind,
    name: property.name?.escapedText,
    optional: isOptional(property),
    jsDoc: extractJsdoc(property.jsDoc),
    path: [path, property.name?.escapedText].filter(i => i?.length).join('.'),
  };

  node.members = (property.members || property.type?.members || []).map(subProperty => convertToNode(subProperty, node.path));
  return node;
};

export const handleStringKeyword = (property, path: string): Node => {
  const node: Node = {
    kind: property.type?.kind || property.kind,
    type: property.type?.kind || property.kind,
    name: property.name?.escapedText,
    optional: isOptional(property),
    jsDoc: extractJsdoc(property.jsDoc),
    path: '',
  };
  node.path = [path, node.name].filter(i => i?.length).join('.');
  return node;
};
export const handleBooleanKeyword = (property, path: string): Node => {
  return handleStringKeyword(property, path);
};
export const handleNumberKeyword = (property, path: string): Node => {
  return handleStringKeyword(property, path);
};
