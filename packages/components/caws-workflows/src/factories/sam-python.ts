import {
  addGenericBranchTrigger,
  addGenericBuildAction,
  addGenericCloudFormationDeployAction,
  addGenericTestReports,
  emptyWorkflow,
} from '.';
import { CfnStageDefinition, StageDefinition, WorkflowDefinition } from '../models';

const DEFAULT_ARTIFACT_NAME = 'MyCustomBuildArtifactName';
const DEFAULT_COVERAGE_ARTIFACT = 'CoverageArtifact';
const DEFAULT_TEST_ARTIFACT = 'TestArtifact';

export function generate(
  defaultBranch = 'main',
  stages: StageDefinition[] = [],
  stackName: string,
  s3BucketName: string,
  buildRoleArn: string,
  tests: boolean,
  stackRoleArn: string,
  region = 'us-west-2',
): WorkflowDefinition {
  const workflow: WorkflowDefinition = emptyWorkflow;

  addGenericBranchTrigger(workflow, [defaultBranch]);

  addGenericBuildAction(workflow, buildRoleArn, [
    { Run: 'python --version' },
    { Run: 'sam build' },
    {
      Run: `sam package --template-file ./.aws-sam/build/template.yaml --s3-bucket ${s3BucketName} --output-template-file output.yaml --region ${region}`,
    },
  ],
  DEFAULT_ARTIFACT_NAME);

  let dependsOn = 'Build';
  if (tests) {
    dependsOn = 'Test';
    addGenericTestReports(workflow, [
      {
        Run: 'python3 -m pip install -r tests/requirements.txt',
      },
      {
        Run: 'python3 -m pytest tests/unit -v --junitxml=reports/report.xml  --cov="tests" --cov-report xml:reports/cov.xml',
      },
    ],
    DEFAULT_COVERAGE_ARTIFACT, DEFAULT_TEST_ARTIFACT);
  }

  stages.forEach(stage => {
    addGenericCloudFormationDeployAction(
      workflow,
      {
        ...stage,
        stackRoleArn,
      } as CfnStageDefinition,
      `${stackName}-${stage.environment.title}`,
      region,
      dependsOn,
      DEFAULT_ARTIFACT_NAME,
    );
  });
  return workflow;
}
