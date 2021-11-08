/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ts from 'typescript';

const IGNORED_AST_KEYS = new Set(['end', 'endPos', 'pos', 'modifierFlagsCache', 'flags', 'transformFlags']);

/**
 * Takes a TypeScript definition source and returns an equivalent AST with all types enumerated inside a json.
 * @param typescriptDefinitionSource - type definition source. e.g. my-class.d.ts
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getAstJSON = (typescriptDefinitionSource: string): string => {
    
    const sourceFile:  Partial<ts.SourceFile> = ts.createSourceFile('temp-ast.d.ts', typescriptDefinitionSource, ts.ScriptTarget.Latest, true);
    
    // Add an ID to every node in the tree to make it easier to identify in
    // the consuming application.
    let nextId = 0;
    function addId(node: any): void {
        nextId++;
        node.id = nextId;
        ts.forEachChild(node, addId);
    }

    addId(sourceFile);

    // No need to save the source again. Strip it from the AST.
    delete sourceFile.text;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cache: any[] = [];
    const json = JSON.stringify(sourceFile, (key, value) => {
        // Discard ignored AST Keys following.
        if (IGNORED_AST_KEYS.has(key)) return;
    
        // Replace 'kind' with the string representation.
        if (key === 'kind') {
            value = ts.SyntaxKind[value];
        }
        
        if (typeof value === 'object' && value !== null) {
            // Duplicate reference found, discard key
            if (cache.includes(value)) return;
            cache.push(value);
        }
        return value;
    });
    return json;
}