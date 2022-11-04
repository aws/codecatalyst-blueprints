export interface RuntimeMapping {
  filesToCreate: Array<FileTemplate>;
}

export interface FileTemplate {
  resolvePath: (context: FileTemplateContext) => string;
  resolveContent: (context: FileTemplateContext) => string;
}

export interface FileTemplateContext {
  repositoryRelativePath: string;
}
