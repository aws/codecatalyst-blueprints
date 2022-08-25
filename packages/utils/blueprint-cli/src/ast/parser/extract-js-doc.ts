export interface JsDoc {
  description?: string;
  tags?: { [key: string]: string };
}

export const extractJsdoc = (jsDocs: any[]): JsDoc | undefined => {
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
