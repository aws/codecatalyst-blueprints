import { java11, python36, nodejs14 } from './templateContents';
import { RuntimeMapping } from './models';

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
    },
  ],
  [
    'Python 3',
    {
      runtime: 'python3.6',
      codeUri: 'hello_world/',
      srcCodePath: 'hello_world',
      testPath: 'tests',
      handler: 'app.lambda_handler',
      templateProps: python36,
      cacheDir: 'python36',
      gitSrcPath: 'cookiecutter-aws-sam-hello-python',
      dependenciesFilePath: 'requirements.txt',
      //https://github.com/aws/aws-sam-cli/blob/develop/DEVELOPMENT_GUIDE.md
      installInstructions: 'Install [Python3.6](https://www.python.org/downloads/)',
    },
  ],
]);
