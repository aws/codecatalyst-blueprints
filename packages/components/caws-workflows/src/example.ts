import {WorkflowDefinition} from './workflow-definition';

export const ciWorkflowExample = (options: {branch: string}): WorkflowDefinition => {
  return {
    Name: 'ci',
    Triggers: [
      {
        Type: 'Push',
        Branches: [options.branch],
      },
      {
        Type: 'PullRequest',
        Branches: [options.branch],
        Events: ['open'],
      },
    ],
    Actions: {
      BuildAndTest: {
        Identifier: 'build-and-test',
        OutputArtifacts: ['CoverageArtifact', 'TestArtifact'],
        Configuration: {
          Steps: [
            {
              Run: 'python3 -m pip install -r tests/requirements.txt',
            },
            {
              Run: "python3 -m pytest tests/unit -v --junitxml=reports/report.xml  --cov='tests' --cov-report xml:reports/cov.xml",
            },
          ],
          Artifacts: [
            {
              Name: 'CoverageArtifact',
              Files: ['reports/cov.xml'],
            },
            {
              Name: 'TestArtifact',
              Files: ['reports/report.xml'],
            },
          ],
          Reports: [
            {
              Name: 'CoverageArtifact',
              TestResults: {
                ReferenceArtifact: 'CoverageArtifact',
                Format: 'CoberturaXml',
              },
            },
            {
              Name: 'TestArtifact',
              TestResults: {
                ReferenceArtifact: 'TestArtifact',
                Format: 'JunitXml',
              },
            },
          ],
        },
      },
    },
  };
};

export interface ExampleReleaseWorkflowRequirements {
  branch: string;
  ActionRoleArn: string;
  S3_BUCKET: string;
  CodeAwsRoleARN: string;
  StackRoleARN: string;
}
export const releaseWorkflowExample = (
  options: ExampleReleaseWorkflowRequirements,
): WorkflowDefinition => {
  return {
    Name: 'release',
    Triggers: [
      {
        Type: 'Push',
        Branches: [options.branch],
      },
    ],
    Actions: {
      BuildBackend: {
        Identifier: 'aws/build@v1',
        OutputArtifacts: ['buildArtifact'],
        Configuration: {
          ActionRoleArn: options.ActionRoleArn,
          Variables: [
            {
              Name: 'S3_BUCKET',
              Value: options.S3_BUCKET,
            },
          ],
          Steps: [
            {
              Run: 'sam build',
            },
            {
              Run: 'sam package --template-file .aws-sam/build/template.yaml --s3-bucket $S3_BUCKET --output-template-file template-packaged.yaml --region us-west-2',
            },
          ],
          Artifacts: [
            {
              Name: 'buildArtifact',
              Files: ['template-packaged.yaml'],
            },
          ],
        },
      },
    },
    DeployCloudFormationStack: {
      DependsOn: ['buildArtifact'],
      Identifier: 'aws/cloudformation-deploy@v1',
      InputArtifacts: ['BuildArtifact'],
      Configuration: {
        CodeAwsRoleARN: options.CodeAwsRoleARN,
        StackRoleARN: options.StackRoleARN,
        StackName: 'serverless-api-stack',
        StackRegion: 'us-west-2',
        TemplatePath: 'buildArtifact::template-packaged.yaml',
      },
    },
  };
};
