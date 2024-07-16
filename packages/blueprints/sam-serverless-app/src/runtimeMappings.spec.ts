import { runtimeMappings } from './runtimeMappings';

describe('runtime mappings', () => {
  const fileTemplateContext = {
    repositoryRelativePath: 'testRepositoryRelativePath',
    lambdaFunctionName: 'testLambdaFunctionName',
  };

  describe('Java 11 Maven', () => {
    const mapping = runtimeMappings['Java 11 Maven'];

    it('includes additional template props', () => {
      expect(mapping.templateProps).toContain('MemorySize: 512');
    });

    it('creates run-tests.sh and ide settings', () => {
      expect(mapping.filesToCreate).toHaveLength(11);
      expect(mapping.filesToCreate[0].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.codecatalyst/scripts/run-tests.sh');
      expect(mapping.filesToCreate[0].resolveContent(fileTemplateContext)).toContain('-f testLambdaFunctionName/HelloWorldFunction');

      expect(mapping.filesToCreate[1].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.idea/runConfigurations/run_tests.xml');
      expect(mapping.filesToCreate[1].resolveContent(fileTemplateContext)).toContain('$PROJECT_DIR$/testLambdaFunctionName/HelloWorldFunction');
      expect(mapping.filesToCreate[2].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.idea/runConfigurations/sam_build.xml');
      expect(mapping.filesToCreate[2].resolveContent(fileTemplateContext)).toContain('$PROJECT_DIR$');
      expect(mapping.filesToCreate[3].resolvePath(fileTemplateContext)).toBe(
        'testRepositoryRelativePath/.idea/runConfigurations/sam_local_invoke.xml',
      );
      expect(mapping.filesToCreate[3].resolveContent(fileTemplateContext)).toContain(
        'sam local invoke testLambdaFunctionNameFunction --event testLambdaFunctionName/events/event.json',
      );
      expect(mapping.filesToCreate[4].resolvePath(fileTemplateContext)).toBe(
        'testRepositoryRelativePath/.idea/runConfigurations/sam_start_local_api.xml',
      );
      expect(mapping.filesToCreate[4].resolveContent(fileTemplateContext)).toContain('$PROJECT_DIR$');
      expect(mapping.filesToCreate[5].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.idea/externalDependencies.xml');
      expect(mapping.filesToCreate[5].resolveContent(fileTemplateContext)).toContain('aws.toolkit');

      expect(mapping.filesToCreate[6].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.vscode/launch.json');
      expect(mapping.filesToCreate[6].resolveContent(fileTemplateContext)).toContain('${workspaceFolder}/testLambdaFunctionName/HelloWorldFunction');
      expect(mapping.filesToCreate[7].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.vscode/tasks.json');
      expect(mapping.filesToCreate[7].resolveContent(fileTemplateContext)).toContain('${workspaceFolder}/testLambdaFunctionName/HelloWorldFunction');
      expect(mapping.filesToCreate[8].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.vscode/extensions.json');
      expect(mapping.filesToCreate[8].resolveContent(fileTemplateContext)).toContain('vscjava.vscode-maven');

      expect(mapping.filesToCreate[9].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.cloud9/runners/SAM Project Builder.run');
      expect(mapping.filesToCreate[9].resolveContent(fileTemplateContext)).toContain('sam build');
      expect(mapping.filesToCreate[10].resolvePath(fileTemplateContext)).toBe(
        'testRepositoryRelativePath/.cloud9/runners/SAM Project Test Runner.run',
      );
      expect(mapping.filesToCreate[10].resolveContent(fileTemplateContext)).toContain('mvn test');
    });

    it('overrides pom.xml', () => {
      expect(mapping.filesToOverride).toHaveLength(1);
      expect(mapping.filesToOverride[0].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/HelloWorldFunction/pom.xml');
      expect(mapping.filesToOverride[0].resolveContent(fileTemplateContext)).toContain('<artifactId>jacoco-maven-plugin</artifactId>');
    });

    it('does not change permissions on anything', () => {
      expect(mapping.filesToChangePermissionsFor).toHaveLength(0);
    });
  });

  describe('Java 11 Gradle', () => {
    const mapping = runtimeMappings['Java 11 Gradle'];

    it('includes additional template props', () => {
      expect(mapping.templateProps).toContain('MemorySize: 512');
    });

    it('creates run-tests.sh and IDE settings', () => {
      expect(mapping.filesToCreate).toHaveLength(11);
      expect(mapping.filesToCreate[0].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.codecatalyst/scripts/run-tests.sh');
      expect(mapping.filesToCreate[0].resolveContent(fileTemplateContext)).toContain('GRADLE_DIR=testLambdaFunctionName/HelloWorldFunction');

      expect(mapping.filesToCreate[1].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.idea/runConfigurations/run_tests.xml');
      expect(mapping.filesToCreate[1].resolveContent(fileTemplateContext)).toContain('$PROJECT_DIR$/testLambdaFunctionName/HelloWorldFunction');
      expect(mapping.filesToCreate[2].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.idea/runConfigurations/sam_build.xml');
      expect(mapping.filesToCreate[2].resolveContent(fileTemplateContext)).toContain('$PROJECT_DIR$');
      expect(mapping.filesToCreate[3].resolvePath(fileTemplateContext)).toBe(
        'testRepositoryRelativePath/.idea/runConfigurations/sam_local_invoke.xml',
      );
      expect(mapping.filesToCreate[3].resolveContent(fileTemplateContext)).toContain(
        'sam local invoke testLambdaFunctionNameFunction --event testLambdaFunctionName/events/event.json',
      );
      expect(mapping.filesToCreate[4].resolvePath(fileTemplateContext)).toBe(
        'testRepositoryRelativePath/.idea/runConfigurations/sam_start_local_api.xml',
      );
      expect(mapping.filesToCreate[4].resolveContent(fileTemplateContext)).toContain('$PROJECT_DIR$');
      expect(mapping.filesToCreate[5].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.idea/externalDependencies.xml');
      expect(mapping.filesToCreate[5].resolveContent(fileTemplateContext)).toContain('aws.toolkit');

      expect(mapping.filesToCreate[6].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.vscode/launch.json');
      expect(mapping.filesToCreate[6].resolveContent(fileTemplateContext)).toContain('${workspaceFolder}/testLambdaFunctionName/HelloWorldFunction');
      expect(mapping.filesToCreate[7].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.vscode/tasks.json');
      expect(mapping.filesToCreate[7].resolveContent(fileTemplateContext)).toContain('${workspaceFolder}/testLambdaFunctionName/HelloWorldFunction');
      expect(mapping.filesToCreate[8].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.vscode/extensions.json');
      expect(mapping.filesToCreate[8].resolveContent(fileTemplateContext)).toContain('vscjava.vscode-gradle');

      expect(mapping.filesToCreate[9].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.cloud9/runners/SAM Project Builder.run');
      expect(mapping.filesToCreate[9].resolveContent(fileTemplateContext)).toContain('sam build');
      expect(mapping.filesToCreate[10].resolvePath(fileTemplateContext)).toBe(
        'testRepositoryRelativePath/.cloud9/runners/SAM Project Test Runner.run',
      );
      expect(mapping.filesToCreate[10].resolveContent(fileTemplateContext)).toContain('gradle test');
    });

    it('overrides build.gradle', () => {
      expect(mapping.filesToOverride).toHaveLength(1);
      expect(mapping.filesToOverride[0].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/HelloWorldFunction/build.gradle');
      expect(mapping.filesToOverride[0].resolveContent(fileTemplateContext)).toContain(
        "reportsDirectory = layout.buildDirectory.dir('coverage-reports')",
      );
    });

    it('marks gradlew executable', () => {
      expect(mapping.filesToChangePermissionsFor).toHaveLength(1);
      expect(mapping.filesToChangePermissionsFor[0].resolvePath(fileTemplateContext)).toBe(
        'testRepositoryRelativePath/testLambdaFunctionName/HelloWorldFunction/gradlew',
      );
      expect(mapping.filesToChangePermissionsFor[0].newPermissions).toEqual({ executable: true });
    });
  });

  describe('Node.js 14', () => {
    const mapping = runtimeMappings['Node.js 14'];

    it('does not contain additional template props', () => {
      expect(mapping.templateProps).toBe('');
    });

    it('creates eleven files', () => {
      expect(mapping.filesToCreate).toHaveLength(11);
      expect(mapping.filesToCreate[0].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.codecatalyst/scripts/run-tests.sh');
      expect(mapping.filesToCreate[0].resolveContent(fileTemplateContext)).toContain('WORKING_DIR=testLambdaFunctionName/hello-world/');

      expect(mapping.filesToCreate[1].resolvePath(fileTemplateContext)).toBe(
        'testRepositoryRelativePath/.idea/runConfigurations/all_tests_coverage.xml',
      );
      expect(mapping.filesToCreate[1].resolveContent(fileTemplateContext)).toContain('$PROJECT_DIR$/testLambdaFunctionName/hello-world/package.json');
      expect(mapping.filesToCreate[2].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.idea/runConfigurations/sam_build.xml');
      expect(mapping.filesToCreate[2].resolveContent(fileTemplateContext)).toContain('$PROJECT_DIR$');
      expect(mapping.filesToCreate[3].resolvePath(fileTemplateContext)).toBe(
        'testRepositoryRelativePath/.idea/runConfigurations/sam_local_invoke.xml',
      );
      expect(mapping.filesToCreate[3].resolveContent(fileTemplateContext)).toContain(
        'sam local invoke testLambdaFunctionNameFunction --event testLambdaFunctionName/events/event.json',
      );
      expect(mapping.filesToCreate[4].resolvePath(fileTemplateContext)).toBe(
        'testRepositoryRelativePath/.idea/runConfigurations/sam_start_local_api.xml',
      );
      expect(mapping.filesToCreate[4].resolveContent(fileTemplateContext)).toContain('$PROJECT_DIR$');
      expect(mapping.filesToCreate[5].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.idea/externalDependencies.xml');
      expect(mapping.filesToCreate[5].resolveContent(fileTemplateContext)).toContain('aws.toolkit');

      expect(mapping.filesToCreate[6].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.vscode/launch.json');
      expect(mapping.filesToCreate[6].resolveContent(fileTemplateContext)).toContain('${workspaceFolder}/testLambdaFunctionName');

      expect(mapping.filesToCreate[7].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.vscode/tasks.json');
      expect(mapping.filesToCreate[7].resolveContent(fileTemplateContext)).toContain('${workspaceFolder}/testLambdaFunctionName');

      expect(mapping.filesToCreate[8].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.vscode/extensions.json');
      expect(mapping.filesToCreate[8].resolveContent(fileTemplateContext)).toContain('AmazonWebServices.aws-toolkit-vscode');

      expect(mapping.filesToCreate[9].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.cloud9/runners/SAM Project Builder.run');
      expect(mapping.filesToCreate[9].resolveContent(fileTemplateContext)).toContain('sam build');

      expect(mapping.filesToCreate[10].resolvePath(fileTemplateContext)).toBe(
        'testRepositoryRelativePath/.cloud9/runners/SAM Project Test Runner.run',
      );
      expect(mapping.filesToCreate[10].resolveContent(fileTemplateContext)).toContain('npm run test');
    });

    it('overrides package.json', () => {
      expect(mapping.filesToOverride).toHaveLength(1);
      expect(mapping.filesToOverride[0].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/hello-world/package.json');
      expect(mapping.filesToOverride[0].resolveContent(fileTemplateContext)).toContain('hello world sample for NodeJS');
    });

    it('does not change permissions on anything', () => {
      expect(mapping.filesToChangePermissionsFor).toHaveLength(0);
    });
  });

  describe('Python 3.9', () => {
    const mapping = runtimeMappings['Python 3.9'];

    it('does not contain additional template props', () => {
      expect(mapping.templateProps).toBe('');
    });

    it('creates fifteen files', () => {
      expect(mapping.filesToCreate).toHaveLength(15);

      expect(mapping.filesToCreate[0].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.codecatalyst/scripts/bootstrap.sh');
      expect(mapping.filesToCreate[0].resolveContent(fileTemplateContext)).toContain(
        '$VENV/bin/pip install -r testLambdaFunctionName/hello_world/requirements.txt',
      );

      expect(mapping.filesToCreate[1].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.codecatalyst/scripts/run-tests.sh');
      expect(mapping.filesToCreate[1].resolveContent(fileTemplateContext)).toContain(
        'PYTHONPATH=testLambdaFunctionName pytest --junitxml=test_results.xml --cov-report xml:test_coverage.xml --cov=. testLambdaFunctionName/tests/unit/',
      );

      expect(mapping.filesToCreate[2].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.coveragerc');
      expect(mapping.filesToCreate[2].resolveContent(fileTemplateContext)).toContain('omit = testLambdaFunctionName/tests/integration/*');

      expect(mapping.filesToCreate[3].resolvePath(fileTemplateContext)).toBe(
        'testRepositoryRelativePath/.idea/runConfigurations/application_integration_tests.xml',
      );
      expect(mapping.filesToCreate[3].resolveContent(fileTemplateContext)).toContain('$PROJECT_DIR$/testLambdaFunctionName/tests/integration');
      expect(mapping.filesToCreate[4].resolvePath(fileTemplateContext)).toBe(
        'testRepositoryRelativePath/.idea/runConfigurations/application_unit_tests.xml',
      );
      expect(mapping.filesToCreate[4].resolveContent(fileTemplateContext)).toContain('$PROJECT_DIR$/testLambdaFunctionName/tests/unit');
      expect(mapping.filesToCreate[5].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.idea/runConfigurations/sam_build.xml');
      expect(mapping.filesToCreate[5].resolveContent(fileTemplateContext)).toContain('$PROJECT_DIR$');
      expect(mapping.filesToCreate[6].resolvePath(fileTemplateContext)).toBe(
        'testRepositoryRelativePath/.idea/runConfigurations/sam_local_invoke.xml',
      );
      expect(mapping.filesToCreate[6].resolveContent(fileTemplateContext)).toContain(
        'sam local invoke testLambdaFunctionNameFunction --event testLambdaFunctionName/events/event.json',
      );
      expect(mapping.filesToCreate[7].resolvePath(fileTemplateContext)).toBe(
        'testRepositoryRelativePath/.idea/runConfigurations/sam_start_local_api.xml',
      );
      expect(mapping.filesToCreate[7].resolveContent(fileTemplateContext)).toContain('$PROJECT_DIR$');
      expect(mapping.filesToCreate[8].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.idea/externalDependencies.xml');
      expect(mapping.filesToCreate[8].resolveContent(fileTemplateContext)).toContain('aws.toolkit');

      expect(mapping.filesToCreate[9].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.vscode/launch.json');
      expect(mapping.filesToCreate[9].resolveContent(fileTemplateContext)).toContain('${workspaceFolder}/testLambdaFunctionName');

      expect(mapping.filesToCreate[10].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.vscode/tasks.json');
      expect(mapping.filesToCreate[10].resolveContent(fileTemplateContext)).toContain('${workspaceFolder}/testLambdaFunctionName');

      expect(mapping.filesToCreate[11].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.vscode/extensions.json');
      expect(mapping.filesToCreate[11].resolveContent(fileTemplateContext)).toContain('ms-python.python');

      expect(mapping.filesToCreate[12].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.vscode/settings.json');
      expect(mapping.filesToCreate[12].resolveContent(fileTemplateContext)).toContain('"python.defaultInterpreterPath": "python"');

      expect(mapping.filesToCreate[13].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.cloud9/runners/SAM Project Builder.run');
      expect(mapping.filesToCreate[13].resolveContent(fileTemplateContext)).toContain('sam build');

      expect(mapping.filesToCreate[14].resolvePath(fileTemplateContext)).toBe(
        'testRepositoryRelativePath/.cloud9/runners/SAM Project Test Runner.run',
      );
      expect(mapping.filesToCreate[14].resolveContent(fileTemplateContext)).toContain('pytest tests');
    });

    it('overrides tests/requirements.txt', () => {
      expect(mapping.filesToOverride).toHaveLength(1);
      expect(mapping.filesToOverride[0].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/tests/requirements.txt');
      expect(mapping.filesToOverride[0].resolveContent(fileTemplateContext)).toContain('boto3');
    });

    it('does not change permissions on anything', () => {
      expect(mapping.filesToChangePermissionsFor).toHaveLength(0);
    });
  });
});
