import * as ts from 'typescript';
import * as fs from 'fs';

export interface BlueprintIntrospection {
    imports: string[],
    options: OptionsInformation,
    classInfo: ClassInformation
    defaults: any,
}

interface ClassInformation {
    name: string
}
interface OptionsInformation {
    fullSource: string
}

const resolveNamedImportDeclaration = (importDecl: ts.ImportDeclaration, source: ts.SourceFile): string => {
    return importDecl.getText(source)
}

const resolveClassDeclaration = (classDecl: ts.ClassDeclaration): ClassInformation | undefined => {
    try {
        if(classDecl.name) {
            return {
                name: classDecl.name.escapedText.toString()
            }
        }    
    } catch (error) {
        return undefined;
    }
    return undefined;
}

const resolveOptionsInterface = (optionsDecl: ts.InterfaceDeclaration, source: ts.SourceFile): OptionsInformation | undefined => {
    try {
        if(optionsDecl.name.escapedText == 'Options') {
            return {
                fullSource: optionsDecl.getText(source)
            }
        }    
    } catch (error) {
        return undefined;
    }
    return undefined;
}

export const introspectBlueprint = (sourceBlueprintLocation: string, defaultsLocation: string): BlueprintIntrospection => {

    const result = fs.readFileSync(sourceBlueprintLocation, 'utf-8');

    const source = ts.createSourceFile(
        'x.ts',   // fileName
        result, // sourceText
        ts.ScriptTarget.Latest // langugeVersion
    );

    const importDeclarations: string[] = [];
    const defaults = JSON.parse(fs.readFileSync(defaultsLocation, 'utf-8'));
    let classInfo: ClassInformation | undefined = undefined;
    let options: OptionsInformation | undefined = undefined;

    source.forEachChild(child => {
        switch (ts.SyntaxKind[child.kind]) {
        case 'ImportDeclaration': 
            importDeclarations.push(resolveNamedImportDeclaration(child as ts.ImportDeclaration, source));
            break;
        case 'InterfaceDeclaration': 
            options = resolveOptionsInterface(child as ts.InterfaceDeclaration, source) || options;
            break;
        case 'ClassDeclaration': 
            classInfo = resolveClassDeclaration(child as ts.ClassDeclaration) || classInfo;
            break;
        default:
            break;
        }
    });

    return {
        imports: importDeclarations,
        defaults,
        options: options || { fullSource: '' },
        classInfo: classInfo || { name: '' }
    }
}
