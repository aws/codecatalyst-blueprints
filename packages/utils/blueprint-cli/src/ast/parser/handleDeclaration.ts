import { convertToNode, JsDoc, Node } from './parser';

export const handleArrayType = (property): Node => {
  const node: Node = {
    type: property.type?.kind,
    kind: property.type?.elementType?.kind,
    name: property.name?.escapedText,
    optional: property.questionToken ?? false,
    jsDoc: extractJsdoc(property.jsDoc),
  };

  node.members = [convertToNode(property.type?.elementType)];
  return node;
};
export const handleBooleanKeyword = (property): Node => {
  return handleStringKeyword(property);
};
export const handleTupleType = (property): Node => {
  const node: Node = {
    type: property.kind,
    kind: property.kind,
    name: property.name?.escapedText,
    optional: property.questionToken ?? false,
    jsDoc: extractJsdoc(property.jsDoc),
  };

  node.members = (property.elements || []).map(element => convertToNode(element));
  return node;
};
export const handleLiteralType = (property): Node => {
  const node: Node = {
    type: property.kind,
    kind: property.literal?.kind,
    name: property.literal?.text,
    optional: property.questionToken ?? false,
    jsDoc: extractJsdoc(property.jsDoc),
  };
  return node;
};

const extractJsdoc = (jsDocs: any[]): JsDoc | undefined => {
  if (!jsDocs) {
    return undefined;
  }

  const documentation = {
    lines: [] as string[],
    tags: {},
  };
  jsDocs.forEach(docElement => {
    if (docElement.kind && docElement.kind == 'JSDocComment') {
      if (docElement.comment) {
        documentation.lines.push(docElement.comment);
      }
      (docElement.tags || []).forEach(tag => {
        const name = tag.tagName?.escapedText;
        const comment = tag.comment;
        documentation.tags[name] = comment;
      });
    }
  });
  return {
    description: documentation.lines.join('\n'),
    tags: documentation.tags,
  };
};

export const handleStringKeyword = (property): Node => {
  const node: Node = {
    kind: property.type?.kind,
    type: property.type?.kind,
    name: property.name?.escapedText,
    optional: property.questionToken ?? false,
    jsDoc: extractJsdoc(property.jsDoc),
  };
  return node;
};
export const handleInterfaceDeclaration = (property): Node => {
  const node: Node = {
    kind: property.kind,
    type: property.kind,
    name: property.name?.escapedText,
    optional: property.questionToken ?? false,
    jsDoc: extractJsdoc(property.jsDoc),
  };
  node.members = (property.members || []).map(subProperty => convertToNode(subProperty));
  return node;
};

export const handleTypeReference = (property): Node => {
  const node: Node = {
    kind: property.type?.kind,
    type: property.type?.typeName?.escapedText,
    name: property.name?.escapedText,
    optional: property.questionToken ?? false,
    jsDoc: extractJsdoc(property.jsDoc),
  };

  node.members = (property.type?.typeArguments || []).map(typeArgument => {
    return convertToNode(typeArgument);
  });
  return node;
};

export const handleUnionType = (property): Node => {
  const node: Node = {
    kind: property.type?.kind,
    type: property.type?.kind,
    name: property.name?.escapedText,
    optional: property.questionToken ?? false,
    jsDoc: extractJsdoc(property.jsDoc),
  };

  node.members = (property.type?.Types || []).map(subProperty => convertToNode(subProperty));
  return node;
};

export const handleNumberKeyword = (property): Node => {
  return handleStringKeyword(property);
};

/**
 * A literal inline type. This is typically a nested type
 * @param property
 * @returns
 */
export const handleTypeLiteral = (property): Node => {
  const node: Node = {
    kind: property.type?.kind || property.kind,
    type: property.type?.kind || property.kind,
    name: property.name?.escapedText,
    optional: property.questionToken ?? false,
    jsDoc: extractJsdoc(property.jsDoc),
  };

  node.members = (property.type?.members || []).map(subProperty => convertToNode(subProperty));
  return node;
};
