import { java11, python39, nodejs14 } from './templateContents';
import { FileTemplateContext, RuntimeMapping } from './models';
import path from 'path';
import { StaticAsset, SubstitionAsset } from '@caws-blueprint-component/caws-source-repositories';
import { ComputeType, ComputeFleet } from '@caws-blueprint-component/caws-workflows';
import { Options } from './blueprint';

// Ideally we would do it the other way around, with this file defining the union of runtimes
// and the blueprint importing this type, but today the Blueprint Wizard does not support
// this indirection.
export type BlueprintRuntimes = Options['runtime'];

type RuntimeMap = {
  [key in BlueprintRuntimes]: RuntimeMapping;
};

export const runtimeMappings: RuntimeMap = {
  'Java 11 Maven': {
    runtime: 'java11',
    codeUri: 'HelloWorldFunction',
    srcCodePath: 'HelloWorldFunction/src/main',
    testPath: 'HelloWorldFunction/src/test',
    handler: 'helloworld.App::handleRequest',
    templateProps: java11,
    cacheDir: 'java11maven',
    gitSrcPath: 'cookiecutter-aws-sam-hello-java-maven',
    dependenciesFilePath: 'pom.xml',
    installInstructions:
      'Install [Python 3](https://www.python.org/downloads/)\n * Install [Java 11](https://docs.aws.amazon.com/corretto/latest/corretto-11-ug/downloads-list.html) and [Maven](https://maven.apache.org/download.cgi)',
    stepsToRunUnitTests: ['. ./.codecatalyst/scripts/run-tests.sh'],
    filesToCreate: [
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.codecatalyst', 'scripts', 'run-tests.sh');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('maven/run-tests.sh').subsitite({ lambdaFunctionName: context.lambdaFunctionName });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.vscode', 'launch.json');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('maven/.vscode/launch.json').subsitite({ lambdaFunctionName: context.lambdaFunctionName });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.vscode', 'tasks.json');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('maven/.vscode/tasks.json').subsitite({ lambdaFunctionName: context.lambdaFunctionName });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.vscode', 'extensions.json');
        },
        resolveContent(): string {
          return new StaticAsset('maven/.vscode/extensions.json').toString();
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.cloud9', 'runners', 'SAM Project Builder.run');
        },
        resolveContent(): string {
          return new StaticAsset('maven/.cloud9/runners/SAM Project Builder.run').toString();
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.cloud9', 'runners', 'SAM Project Test Runner.run');
        },
        resolveContent(): string {
          return new StaticAsset('maven/.cloud9/runners/SAM Project Test Runner.run').toString();
        },
      },
    ],
    filesToOverride: [
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, 'HelloWorldFunction', 'pom.xml');
        },
        // @ts-ignore
        resolveContent(context: FileTemplateContext): string {
          return new StaticAsset('maven/pom.xml').toString();
        },
      },
    ],
    filesToChangePermissionsFor: [],
    computeOptions: {
      Type: ComputeType.LAMBDA,
      Fleet: ComputeFleet.LINUX_X86_64_LARGE,
    },
  },
  'Java 11 Gradle': {
    runtime: 'java11',
    codeUri: 'HelloWorldFunction',
    srcCodePath: 'HelloWorldFunction/src/main',
    testPath: 'HelloWorldFunction/src/test',
    handler: 'helloworld.App::handleRequest',
    templateProps: java11,
    cacheDir: 'java11gradle',
    gitSrcPath: 'cookiecutter-aws-sam-hello-java-gradle',
    dependenciesFilePath: 'build.gradle',
    installInstructions:
      'Install [Python 3](https://www.python.org/downloads/)\n * Install [Java 11](https://docs.aws.amazon.com/corretto/latest/corretto-11-ug/downloads-list.html) and [Gradle](https://gradle.org/install/)',
    stepsToRunUnitTests: ['. ./.codecatalyst/scripts/run-tests.sh'],
    filesToCreate: [
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.codecatalyst', 'scripts', 'run-tests.sh');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('gradle/run-tests.sh').subsitite({ lambdaFunctionName: context.lambdaFunctionName });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.vscode', 'launch.json');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('gradle/.vscode/launch.json').subsitite({ lambdaFunctionName: context.lambdaFunctionName });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.vscode', 'tasks.json');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('gradle/.vscode/tasks.json').subsitite({ lambdaFunctionName: context.lambdaFunctionName });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.vscode', 'extensions.json');
        },
        resolveContent(): string {
          return new StaticAsset('gradle/.vscode/extensions.json').toString();
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.cloud9', 'runners', 'SAM Project Builder.run');
        },
        resolveContent(): string {
          return new StaticAsset('gradle/.cloud9/runners/SAM Project Builder.run').toString();
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.cloud9', 'runners', 'SAM Project Test Runner.run');
        },
        resolveContent(): string {
          return new StaticAsset('gradle/.cloud9/runners/SAM Project Test Runner.run').toString();
        },
      },
    ],
    filesToOverride: [
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, 'HelloWorldFunction', 'build.gradle');
        },
        // @ts-ignore
        resolveContent(context: FileTemplateContext): string {
          return new StaticAsset('gradle/build.gradle').toString();
        },
      },
    ],
    filesToChangePermissionsFor: [
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, context.lambdaFunctionName, 'HelloWorldFunction', 'gradlew');
        },
        newPermissions: { executable: true },
      },
    ],
    computeOptions: {
      Type: ComputeType.LAMBDA,
      Fleet: ComputeFleet.LINUX_X86_64_LARGE,
    },
  },
  'Node.js 14': {
    runtime: 'nodejs14.x',
    codeUri: 'hello-world/',
    srcCodePath: 'hello-world',
    testPath: 'hello-world/tests',
    handler: 'app.lambdaHandler',
    templateProps: nodejs14,
    cacheDir: 'nodejs14',
    gitSrcPath: 'cookiecutter-aws-sam-hello-nodejs',
    dependenciesFilePath: 'package.json',
    installInstructions:
      'Install [Python 3](https://www.python.org/downloads/)\n * Install [Node.js 14 and npm](https://nodejs.org/en/download/releases/)',
    stepsToRunUnitTests: ['. ./.codecatalyst/scripts/run-tests.sh'],
    filesToCreate: [
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.codecatalyst', 'scripts', 'run-tests.sh');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('nodejs/run-tests.sh').subsitite({ lambdaFunctionName: context.lambdaFunctionName });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.vscode', 'launch.json');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('nodejs/.vscode/launch.json').subsitite({ lambdaFunctionName: context.lambdaFunctionName });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.vscode', 'tasks.json');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('nodejs/.vscode/tasks.json').subsitite({ lambdaFunctionName: context.lambdaFunctionName });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.vscode', 'extensions.json');
        },
        resolveContent(): string {
          return new StaticAsset('nodejs/.vscode/extensions.json').toString();
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.cloud9', 'runners', 'SAM Project Builder.run');
        },
        resolveContent(): string {
          return new StaticAsset('nodejs/.cloud9/runners/SAM Project Builder.run').toString();
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.cloud9', 'runners', 'SAM Project Test Runner.run');
        },
        resolveContent(): string {
          return new StaticAsset('nodejs/.cloud9/runners/SAM Project Test Runner.run').toString();
        },
      },
    ],
    filesToOverride: [
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, 'hello-world', 'package.json');
        },
        // @ts-ignore
        resolveContent(context: FileTemplateContext): string {
          return new StaticAsset('nodejs/package.json').toString();
        },
      },
    ],
    filesToChangePermissionsFor: [],
    autoDiscoveryOverride: {
      ReportNamePrefix: 'AutoDiscovered',
      IncludePaths: ['**/*'],
      ExcludePaths: ['.aws-sam/**/*'],
      Enabled: true,
      SuccessCriteria: {
        PassRate: 100,
        LineCoverage: 65,
        BranchCoverage: 50,
      },
    },
    computeOptions: {
      Type: ComputeType.LAMBDA,
      Fleet: ComputeFleet.LINUX_X86_64_LARGE,
    },
  },
  'Python 3.9': {
    runtime: 'python3.9',
    codeUri: 'hello_world/',
    srcCodePath: 'hello_world',
    testPath: 'tests',
    handler: 'app.lambda_handler',
    templateProps: python39,
    cacheDir: 'python39',
    gitSrcPath: 'cookiecutter-aws-sam-hello-python',
    dependenciesFilePath: 'requirements.txt',
    installInstructions: 'Install [Python3.9](https://www.python.org/downloads/)',
    stepsToRunUnitTests: ['. ./.codecatalyst/scripts/bootstrap.sh', '. ./.codecatalyst/scripts/run-tests.sh'],
    filesToCreate: [
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.codecatalyst', 'scripts', 'bootstrap.sh');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('python/bootstrap.sh').subsitite({ lambdaFunctionName: context.lambdaFunctionName });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.codecatalyst', 'scripts', 'run-tests.sh');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('python/run-tests.sh').subsitite({ lambdaFunctionName: context.lambdaFunctionName });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.coveragerc');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('python/.coveragerc').subsitite({ lambdaFunctionName: context.lambdaFunctionName });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.vscode', 'launch.json');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('python/.vscode/launch.json').subsitite({ lambdaFunctionName: context.lambdaFunctionName });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.vscode', 'tasks.json');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('python/.vscode/tasks.json').subsitite({ lambdaFunctionName: context.lambdaFunctionName });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.vscode', 'extensions.json');
        },
        resolveContent(): string {
          return new StaticAsset('python/.vscode/extensions.json').toString();
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.vscode', 'settings.json');
        },
        resolveContent(): string {
          return new StaticAsset('python/.vscode/settings.json').toString();
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.cloud9', 'runners', 'SAM Project Builder.run');
        },
        resolveContent(): string {
          return new StaticAsset('python/.cloud9/runners/SAM Project Builder.run').toString();
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.cloud9', 'runners', 'SAM Project Test Runner.run');
        },
        resolveContent(): string {
          return new StaticAsset('python/.cloud9/runners/SAM Project Test Runner.run').toString();
        },
      },
    ],
    filesToOverride: [
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, 'tests/requirements.txt');
        },
        // @ts-ignore
        resolveContent(context: FileTemplateContext): string {
          return new StaticAsset('python/requirements-dev.txt').toString();
        },
      },
    ],
    filesToChangePermissionsFor: [],
    samBuildImage: 'amazon/aws-sam-cli-build-image-python3.9',
    computeOptions: {
      Type: ComputeType.EC2,
      Fleet: ComputeFleet.LINUX_X86_64_LARGE,
    },
  },
};
