export interface RuntimeMapping {
  runtime: string;
  codeUri: string;
  srcCodePath: string;
  testPath: string;
  handler: string;
  templateProps: string;
  cacheDir: string;
  gitSrcPath: string;
  dependenciesFilePath: string;
  installInstructions: string;
  stepsToRunUnitTests: Array<string>;
  filesToCreate: Array<FileTemplate>;
  filesToOverride: Array<FileTemplate>;
}

export interface FileTemplate {
  resolvePath: (context: FileTemplateContext) => string;
  resolveContent: (context: FileTemplateContext) => string;
}

export interface FileTemplateContext {
  repositoryRelativePath: string;
  lambdaFunctionName: string;
}

/**
 * This is so that you can specify which lambdas you want in each api gateway
 */
/*
interface ApiGateway{
   name: string;
   runtime: 'Python 3' | '.NET Core 3' | 'Ruby 2.7' | 'Node.js 14' | 'Java 11 Maven';
   lambdas: Lambda[];
}
*/
