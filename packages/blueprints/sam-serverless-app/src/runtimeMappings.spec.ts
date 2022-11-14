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

    it('creates run-tests.sh', () => {
      expect(mapping.filesToCreate).toHaveLength(1);
      expect(mapping.filesToCreate[0].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.codecatalyst/scripts/run-tests.sh');
      expect(mapping.filesToCreate[0].resolveContent(fileTemplateContext)).toContain('-f testLambdaFunctionName/HelloWorldFunction');
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

    it('creates run-tests.sh', () => {
      expect(mapping.filesToCreate).toHaveLength(1);
      expect(mapping.filesToCreate[0].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.codecatalyst/scripts/run-tests.sh');
      expect(mapping.filesToCreate[0].resolveContent(fileTemplateContext)).toContain('GRADLE_DIR=testLambdaFunctionName/HelloWorldFunction');
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

    it('creates run-tests.sh', () => {
      expect(mapping.filesToCreate).toHaveLength(1);
      expect(mapping.filesToCreate[0].resolvePath(fileTemplateContext)).toBe('testRepositoryRelativePath/.codecatalyst/scripts/run-tests.sh');
      expect(mapping.filesToCreate[0].resolveContent(fileTemplateContext)).toContain('WORKING_DIR=testLambdaFunctionName/hello-world/');
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

    it('creates three files', () => {
      expect(mapping.filesToCreate).toHaveLength(3);

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
