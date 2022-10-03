import { java11, python39, nodejs14 } from './templateContents';
import { FileTemplateContext, RuntimeMapping } from './models';
import path from 'path';
import { StaticAsset, SubstitionAsset } from '@caws-blueprint-component/caws-source-repositories';

export const runtimeMappings: Map<string, RuntimeMapping> = new Map([
  [
    'Java 11 Maven',
    {
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
      stepsToRunUnitTests: [],
      filesToCreate: [],
      filesToOverride: [],
      filesToChangePermissionsFor: [],
      readmeTestSection: `
## Tests
Tests are defined in the \`HelloWorldFunction/src/test\` folder in this project.
\`\`\`
$ cd HelloWorldFunction
$ mvn test
\`\`\`
`,
    },
  ],
  [
    'Java 11 Gradle',
    {
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
      stepsToRunUnitTests: ['. ./.aws/scripts/run-tests.sh'],
      filesToCreate: [
        {
          resolvePath(context: FileTemplateContext) {
            return path.join(context.repositoryRelativePath, '.aws', 'scripts', 'run-tests.sh');
          },
          resolveContent(context: FileTemplateContext): string {
            return new SubstitionAsset('gradle/run-tests.sh').subsitite({ lambdaFunctionName: context.lambdaFunctionName });
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

      readmeTestSection: `
## Tests
Tests are defined in the \`HelloWorldFunction/src/test\` folder in this project.
\`\`\`
$ cd HelloWorldFunction
$ gradle test
\`\`\`
`,
    },
  ],
  [
    'Node.js 14',
    {
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
      stepsToRunUnitTests: ['. ./.aws/scripts/run-tests.sh'],
      filesToCreate: [
        {
          resolvePath(context: FileTemplateContext) {
            return path.join(context.repositoryRelativePath, '.aws', 'scripts', 'run-tests.sh');
          },
          resolveContent(context: FileTemplateContext): string {
            return new SubstitionAsset('nodejs/run-tests.sh').subsitite({ lambdaFunctionName: context.lambdaFunctionName });
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
      readmeTestSection: `
## Tests
Tests are defined in the \`hello-world/tests\` folder in this project. Use NPM to install the [Mocha test framework](https://mochajs.org/) and run unit tests.
\`\`\`
$ cd hello-world
$ npm install
$ npm run test
\`\`\`
`,
    },
  ],
  [
    'Python 3.9',
    {
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
      stepsToRunUnitTests: ['. ./.aws/scripts/bootstrap.sh', '. ./.aws/scripts/run-tests.sh'],
      filesToCreate: [
        {
          resolvePath(context: FileTemplateContext) {
            return path.join(context.repositoryRelativePath, '.aws', 'scripts', 'bootstrap.sh');
          },
          resolveContent(context: FileTemplateContext): string {
            return new SubstitionAsset('python/bootstrap.sh').subsitite({ lambdaFunctionName: context.lambdaFunctionName });
          },
        },
        {
          resolvePath(context: FileTemplateContext) {
            return path.join(context.repositoryRelativePath, '.aws', 'scripts', 'run-tests.sh');
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
      readmeTestSection: `
## Tests
Tests are defined in the \`tests\` folder in this project. Use PIP to install the test dependencies and run tests.
\`\`\`
$ pip install -r tests/requirements.txt

# unit test
$ python -m pytest tests/unit -v

# integration test, requires deploying the stack first.
# Create the environment variable AWS_SAM_STACK_NAME with the name of the stack to test
$ AWS_SAM_STACK_NAME=<stack-name> python -m pytest tests/integration -v
\`\`\`
`,
    },
  ],
]);
