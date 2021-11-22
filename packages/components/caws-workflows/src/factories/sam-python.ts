import {
  addGenericBranchTrigger,
  addGenericBuildAction,
  addGenericCloudFormationDeployAction,
  addGenericTestReports,
  emptyWorkflow,
} from '.';
import { StageDefinition, WorkflowDefinition } from '../models';

export function generate(
  defaultBranch = 'main',
  stages: StageDefinition[] = [],
  stackName: string,
  s3BucketName: string,
  buildRoleArn: string,
  tests: boolean,
  region = 'us-west-2',
): WorkflowDefinition {
  const workflow: WorkflowDefinition = emptyWorkflow;

  addGenericBranchTrigger(workflow, defaultBranch);

  addGenericBuildAction(workflow, buildRoleArn, [
    { Run: 'python --version' },
    { Run: 'sam build' },
    {
      Run: `sam package --template-file ./.aws-sam/build/template.yaml --s3-bucket ${s3BucketName} --output-template-file output.yaml --region ${region}`,
    },
  ]);

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
    ]);
  }

  stages.forEach(stage => {
    addGenericCloudFormationDeployAction(
      workflow,
      stage,
      `${stackName}-${stage.environment.title}`,
      region,
      dependsOn,
    );
  });
  return workflow;
}
