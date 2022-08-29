import { java11, python36, nodejs14 } from './templateContents';
import { FileTemplateContext, RuntimeMapping } from './models';
import path from 'path';
import dedent from 'ts-dedent';

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
            return dedent`#!/usr/bin/env bash

                          echo "Running unit tests..."
                          GRADLE_DIR=${context.lambdaFunctionName}/HelloWorldFunction
                          ./$GRADLE_DIR/gradlew test -p $GRADLE_DIR`;
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
            return dedent`plugins {
                              id 'java'
                              id 'jacoco'
                          }

                          repositories {
                              mavenCentral()
                          }

                          dependencies {
                              implementation 'com.amazonaws:aws-lambda-java-core:1.2.1'
                              implementation 'com.amazonaws:aws-lambda-java-events:3.11.0'
                              testImplementation 'junit:junit:4.13.2'
                          }

                          test {
                              finalizedBy jacocoTestReport // report is always generated after tests run
                          }

                          jacocoTestReport {
                              dependsOn test // tests are required to run before generating the report

                              reports {
                                  xml.required = true
                              }
                          }

                          jacoco {
                              toolVersion = "0.8.8"
                              reportsDirectory = layout.buildDirectory.dir('coverage-reports')
                          }

                          sourceCompatibility = 11
                          targetCompatibility = 11`;
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
      stepsToRunUnitTests: [],
      filesToCreate: [],
      filesToOverride: [],
      filesToChangePermissionsFor: [],
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
      installInstructions: 'Install [Python3.6](https://www.python.org/downloads/)',
      stepsToRunUnitTests: ['. ./.aws/scripts/bootstrap.sh', '. ./.aws/scripts/run-tests.sh'],
      filesToCreate: [
        {
          resolvePath(context: FileTemplateContext) {
            return path.join(context.repositoryRelativePath, 'requirements-dev.txt');
          },
          // @ts-ignore
          resolveContent(context: FileTemplateContext): string {
            return dedent`pytest
                          pytest-cov
                          pytest-mock`;
          },
        },
        {
          resolvePath(context: FileTemplateContext) {
            return path.join(context.repositoryRelativePath, '.aws', 'scripts', 'bootstrap.sh');
          },
          resolveContent(context: FileTemplateContext): string {
            return dedent`#!/bin/bash

                          VENV="venv"

                          test -d $VENV || python3 -m venv $VENV || return
                          $VENV/bin/pip install -r requirements-dev.txt
                          $VENV/bin/pip install -r ${context.lambdaFunctionName}/hello_world/requirements.txt
                          . $VENV/bin/activate`;
          },
        },
        {
          resolvePath(context: FileTemplateContext) {
            return path.join(context.repositoryRelativePath, '.aws', 'scripts', 'run-tests.sh');
          },
          resolveContent(context: FileTemplateContext): string {
            return dedent`#!/bin/bash

                          echo "Running unit tests..."
                          PYTHONPATH=${context.lambdaFunctionName} pytest --junitxml=test_results.xml --cov-report xml:test_coverage.xml --cov=. .`;
          },
        },
      ],
      filesToOverride: [],
      filesToChangePermissionsFor: [],
    },
  ],
]);
