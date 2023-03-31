import { AutoDiscoverReportDefinition, ComputeDefintion } from '@caws-blueprint-component/caws-workflows';

import { WriteFileOptions } from 'projen/lib/util';

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
  filesToChangePermissionsFor: Array<FilePermissionChange>;
  computeOptions: ComputeDefintion;
  autoDiscoveryOverride?: AutoDiscoverReportDefinition;
  samBuildImage?: string;
  devEnvironmentPostStartEvents: DevEnvironmentPostStartEvent[];
}

export interface FileTemplate {
  resolvePath: (context: FileTemplateContext) => string;
  resolveContent: (context: FileTemplateContext) => string;
}

export interface FileTemplateContext {
  repositoryRelativePath: string;
  lambdaFunctionName: string;
}

export interface FilePermissionChange {
  resolvePath: (context: FileTemplateContext) => string;
  newPermissions: WriteFileOptions;
}

export interface DevEnvironmentPostStartEvent {
  eventName: string;
  command: string;
  workingDirectory?: string;
}
