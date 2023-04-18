import { generateReadmeContents } from './readmeContents';
import { runtimeMappings } from './runtimeMappings';

describe('readme contents', () => {
  describe('happy case', () => {
    const runtimeMapping = runtimeMappings['Java 11 Gradle'];
    const params = {
      runtime: 'Java 11 Gradle',
      runtimeMapping,
      defaultReleaseBranch: 'test-release-branch',
      functionName: 'lambda1',
      environment: {
        name: 'test-env-name',
        environmentType: 'PRODUCTION',
      },
      cloudFormationStackName: 'test-cfn-stack-name',
      workflowName: 'test-workflow-name',
      sourceRepositoryName: 'test-repo-name',
    };

    const readmeContents = generateReadmeContents(params);

    it('incorporates runtime param', () => {
      expect(readmeContents).toContain('$ gradle test');
    });

    it('incorporates runtimeMapping param', () => {
      expect(readmeContents).toContain(`\`${runtimeMapping.srcCodePath}\` - Code for the AWS Lambda function`);
    });

    it('incorporates defaultReleaseBranch param', () => {
      expect(readmeContents).toContain('The workflow is triggered by pushes to the `test-release-branch` branch of the source repository');
    });

    it('incorporates lambdas param', () => {
      expect(readmeContents).toContain('`lambda1` - Source code');
    });

    it('incorporates environment param', () => {
      expect(readmeContents).toMatch('your project environment `test-env-name`');
    });

    it('incorporates cloudFormationStackName param', () => {
      expect(readmeContents).toContain('using the `test-cfn-stack-name` AWS Cloudformation stack');
    });

    it('incorporates workflowName param', () => {
      expect(readmeContents).toContain('using the workflow defined in `.codecatalyst/workflows/test-workflow-name.yaml`.');
    });

    it('incorporates sourceRepositoryName param', () => {
      expect(readmeContents).toContain('Source repository named `test-repo-name`');
    });
  });
});
