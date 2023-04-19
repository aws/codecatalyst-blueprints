import path from 'path';
import { StaticAsset, SubstitionAsset } from '@caws-blueprint-component/caws-source-repositories';
import { ComputeFleet, ComputeType } from '@caws-blueprint-component/caws-workflows';
import { Options } from './blueprint';
import { FileTemplateContext, RuntimeMapping } from './models';
import { java11, nodejs14, python39 } from './templateContents';

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
    gitSrcPath: 'hello-maven',
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
          return path.join(context.repositoryRelativePath, '.idea', 'runConfigurations', 'run_tests.xml');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('maven/.idea/runConfigurations/run_tests.xml').subsitite({ lambdaFunctionName: context.lambdaFunctionName });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.idea', 'runConfigurations', 'sam_build.xml');
        },
        resolveContent(): string {
          return new StaticAsset('maven/.idea/runConfigurations/sam_build.xml').toString();
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.idea', 'runConfigurations', 'sam_local_invoke.xml');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('maven/.idea/runConfigurations/sam_local_invoke.xml').subsitite({
            lambdaFunctionName: context.lambdaFunctionName,
          });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.idea', 'runConfigurations', 'sam_start_local_api.xml');
        },
        resolveContent(): string {
          return new StaticAsset('maven/.idea/runConfigurations/sam_start_local_api.xml').toString();
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.idea', 'externalDependencies.xml');
        },
        resolveContent(): string {
          return new StaticAsset('maven/.idea/externalDependencies.xml').toString();
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
    devEnvironmentPostStartEvents: [
      {
        eventName: 'bootstrap-and-build',
        command: '. ./.codecatalyst/scripts/run-tests.sh && sam build --template-file template.yaml',
      },
      //TODO: uncomment and separate onmi command once dev environments supports multiple postStart events https://t.corp.amazon.com/V869868907/communication
      // {
      //   eventName: 'sam-build',
      //   command: 'sam build --template-file template.yaml',
      // },
    ],
  },
  'Java 11 Gradle': {
    runtime: 'java11',
    codeUri: 'HelloWorldFunction',
    srcCodePath: 'HelloWorldFunction/src/main',
    testPath: 'HelloWorldFunction/src/test',
    handler: 'helloworld.App::handleRequest',
    templateProps: java11,
    cacheDir: 'java11gradle',
    gitSrcPath: 'hello-gradle',
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
          return path.join(context.repositoryRelativePath, '.idea', 'runConfigurations', 'run_tests.xml');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('gradle/.idea/runConfigurations/run_tests.xml').subsitite({ lambdaFunctionName: context.lambdaFunctionName });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.idea', 'runConfigurations', 'sam_build.xml');
        },
        resolveContent(): string {
          return new StaticAsset('gradle/.idea/runConfigurations/sam_build.xml').toString();
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.idea', 'runConfigurations', 'sam_local_invoke.xml');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('gradle/.idea/runConfigurations/sam_local_invoke.xml').subsitite({
            lambdaFunctionName: context.lambdaFunctionName,
          });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.idea', 'runConfigurations', 'sam_start_local_api.xml');
        },
        resolveContent(): string {
          return new StaticAsset('gradle/.idea/runConfigurations/sam_start_local_api.xml').toString();
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.idea', 'externalDependencies.xml');
        },
        resolveContent(): string {
          return new StaticAsset('gradle/.idea/externalDependencies.xml').toString();
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
    devEnvironmentPostStartEvents: [
      {
        eventName: 'bootstrap-and-build',
        command: '. ./.codecatalyst/scripts/run-tests.sh && sam build --template-file template.yaml',
      },
      //TODO: uncomment and separate onmi command once dev environments supports multiple postStart events https://t.corp.amazon.com/V869868907/communication
      // {
      //   eventName: 'sam-build',
      //   command: 'sam build --template-file template.yaml',
      // },
    ],
  },
  'Node.js 14': {
    runtime: 'nodejs14.x',
    codeUri: 'hello-world/',
    srcCodePath: 'hello-world',
    testPath: 'hello-world/tests',
    handler: 'app.lambdaHandler',
    templateProps: nodejs14,
    templateMetadata: `
    Metadata: # Manage esbuild properties
      BuildMethod: esbuild
      BuildProperties:
        Minify: true
        Target: "es2020"
        # Sourcemap: true # Enabling source maps will create the required NODE_OPTIONS environment variables on your lambda function during sam build
        EntryPoints: 
        - app.ts
`,
    cacheDir: 'nodejs14',
    gitSrcPath: 'hello-ts',
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
          return path.join(context.repositoryRelativePath, '.idea', 'runConfigurations', 'all_tests_coverage.xml');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('nodejs/.idea/runConfigurations/all_tests_coverage.xml').subsitite({
            lambdaFunctionName: context.lambdaFunctionName,
          });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.idea', 'runConfigurations', 'sam_build.xml');
        },
        resolveContent(): string {
          return new StaticAsset('nodejs/.idea/runConfigurations/sam_build.xml').toString();
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.idea', 'runConfigurations', 'sam_local_invoke.xml');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('nodejs/.idea/runConfigurations/sam_local_invoke.xml').subsitite({
            lambdaFunctionName: context.lambdaFunctionName,
          });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.idea', 'runConfigurations', 'sam_start_local_api.xml');
        },
        resolveContent(): string {
          return new StaticAsset('nodejs/.idea/runConfigurations/sam_start_local_api.xml').toString();
        },
      },

      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.idea', 'externalDependencies.xml');
        },
        resolveContent(): string {
          return new StaticAsset('nodejs/.idea/externalDependencies.xml').toString();
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
    devEnvironmentPostStartEvents: [
      {
        eventName: 'bootstrap-and-build',
        command: '. ./.codecatalyst/scripts/run-tests.sh && sam build --template-file template.yaml',
      },
      //TODO: uncomment and separate onmi command once dev environments supports multiple postStart events https://t.corp.amazon.com/V869868907/communication
      // {
      //   eventName: 'sam-build',
      //   command: 'sam build --template-file template.yaml',
      // },
    ],
  },
  'Python 3.9': {
    runtime: 'python3.9',
    codeUri: 'hello_world/',
    srcCodePath: 'hello_world',
    testPath: 'tests',
    handler: 'app.lambda_handler',
    templateProps: python39,
    cacheDir: 'python39',
    gitSrcPath: 'hello',
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
          return path.join(context.repositoryRelativePath, '.idea', 'runConfigurations', 'application_integration_tests.xml');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('python/.idea/runConfigurations/application_integration_tests.xml').subsitite({
            lambdaFunctionName: context.lambdaFunctionName,
          });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.idea', 'runConfigurations', 'application_unit_tests.xml');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('python/.idea/runConfigurations/application_unit_tests.xml').subsitite({
            lambdaFunctionName: context.lambdaFunctionName,
          });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.idea', 'runConfigurations', 'sam_build.xml');
        },
        resolveContent(): string {
          return new StaticAsset('python/.idea/runConfigurations/sam_build.xml').toString();
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.idea', 'runConfigurations', 'sam_local_invoke.xml');
        },
        resolveContent(context: FileTemplateContext): string {
          return new SubstitionAsset('python/.idea/runConfigurations/sam_local_invoke.xml').subsitite({
            lambdaFunctionName: context.lambdaFunctionName,
          });
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.idea', 'runConfigurations', 'sam_start_local_api.xml');
        },
        resolveContent(): string {
          return new StaticAsset('python/.idea/runConfigurations/sam_start_local_api.xml').toString();
        },
      },
      {
        resolvePath(context: FileTemplateContext) {
          return path.join(context.repositoryRelativePath, '.idea', 'externalDependencies.xml');
        },
        resolveContent(): string {
          return new StaticAsset('python/.idea/externalDependencies.xml').toString();
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
    devEnvironmentPostStartEvents: [
      {
        eventName: 'bootstrap-and-build',
        command:
          '. ./.codecatalyst/scripts/bootstrap.sh && . ./.codecatalyst/scripts/run-tests.sh && sam build --template-file template.yaml --use-container --build-image amazon/aws-sam-cli-build-image-python3.9',
      },
      //TODO: uncomment and separate onmi command once dev environments supports multiple postStart events https://t.corp.amazon.com/V869868907/communication
      // {
      //   eventName: 'bootstrap',
      //   command: '. ./.codecatalyst/scripts/bootstrap.sh',
      // },
      // {
      //   eventName: 'run-tests',
      //   command: '. ./.codecatalyst/scripts/run-tests.sh',
      // },
      // {
      //   eventName: 'sam-build',
      //   command: 'sam build --template-file template.yaml --use-container --build-image amazon/aws-sam-cli-build-image-python3.9',
      // },
    ],
  },
};
