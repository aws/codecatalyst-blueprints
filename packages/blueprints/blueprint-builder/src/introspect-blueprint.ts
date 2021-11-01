/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs';
import * as ts from 'typescript';
import { Parameter, ParameterLeaf, ParameterMapping, ParameterNest } from './yaml-blueprint';

export interface BlueprintIntrospection {
  imports: string[]; options: OptionsInformation; classInfo: ClassInformation;
  defaults: any;
  packageJsonContent: any;
  readmeContent: string;
}

interface ClassInformation {
  name: string;
}
interface OptionsInformation {
  fullSource: string;
  nodes: ParameterMapping;
}

const resolveNamedImportDeclaration = (importDecl: ts.ImportDeclaration, source: ts.SourceFile): string => {
  return importDecl.getText(source);
};

const resolveClassDeclaration = (classDecl: ts.ClassDeclaration): ClassInformation | undefined =>{
  try {
    if (classDecl.name) {
      return {
        name: classDecl.name.escapedText.toString(),
      };
    }
  } catch (error) {
    return undefined;
  }
  return undefined;
};

const resolveParameter = (member: ts.PropertySignature, _source: ts.SourceFile, defaults: any, path: string[]): ParameterLeaf | ParameterNest => {
  const Annotations: string[] = [];
  if (member.questionToken) {
    Annotations.push('optional');
  }

  const name = member.name?.getText(_source) || '';
  let displayName = name;
  let description = '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((member as any).jsDoc && (member as any).jsDoc.length == 1) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jsDoc = (member as any).jsDoc[0];

    description = jsDoc.comment;
    (jsDoc.tags || []).forEach(tag => {
      if (tag.tagName == 'DisplayName') {
        displayName = tag.getText(_source);
      } else {
        Annotations.push(tag.tagName.getText(_source));
      }
    });
  }

  let type = member.type?.getText(_source) || '';
  type = type.replace(/\s+/g, ' ');
  const param: Parameter = {
    DisplayName: displayName,
    Description: description,
    Path: path,
    Type: type,
  };
  if (Annotations.length) {
    param.Annotations = Annotations;
  }

  if (member.type && (member.type as any).members && (member.type as any).members[0].jsDoc) {
    type = 'Nesting';
    return {
      ...param,
      Type: type,
      Nested: resolveOptionsNodes(member.type as any, _source, defaults[name] || {}, [...path]),
    };
  }
  return {
    ...param,
    Default: defaults[name] || '',
  };
};

const resolveOptionsNodes = (
  optionsInterfaceAST: ts.InterfaceDeclaration,
  source: ts.SourceFile,
  defaults: any,
  path: string[]): ParameterMapping => {
  const nodes = {};
  optionsInterfaceAST.members.forEach(member => {
    const name = member.name?.getText(source) || '';
    console.log(name);
    nodes[name] = resolveParameter(member as ts.PropertySignature, source, defaults, [...path, name]);
    console.log(nodes[name]);
  });
  return nodes;
};

const resolveOptionsInterface = (
  optionsDecl: ts.InterfaceDeclaration,
  source: ts.SourceFile,
  defaults: any): OptionsInformation | undefined => {
  try {
    if (optionsDecl.name.escapedText == 'Options') {
      return {
        fullSource: optionsDecl.getText(source),
        nodes: resolveOptionsNodes(optionsDecl, source, defaults, []),
      };
    }
  } catch (error) {
    return undefined;
  }
  return undefined;
};

export const introspectBlueprint = (params: {
  sourceBlueprintLocation: string;
  defaultsLocation: string;
  packageJsonLocation: string;
  readmeLocation: string;
}): BlueprintIntrospection => {

  const { sourceBlueprintLocation, defaultsLocation, packageJsonLocation } = params;
  const result = fs.readFileSync(sourceBlueprintLocation, 'utf-8');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonLocation, 'utf-8'));

  const source = ts.createSourceFile(
    'x.ts', // fileName
    result, // sourceText
    ts.ScriptTarget.Latest, // langugeVersion
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
        options = resolveOptionsInterface(child as ts.InterfaceDeclaration, source, defaults) || options;
        break;
      case 'ClassDeclaration':
        classInfo = resolveClassDeclaration(child as ts.ClassDeclaration) || classInfo;
        break;
      default:
        break;
    }
  });

  return {
    packageJsonContent: packageJson,
    imports: importDeclarations,
    defaults,
    options: options || { fullSource: '', nodes: {} },
    classInfo: classInfo || { name: '' },
    readmeContent: fs.readFileSync(params.readmeLocation, 'utf-8') || '',
  };
};
