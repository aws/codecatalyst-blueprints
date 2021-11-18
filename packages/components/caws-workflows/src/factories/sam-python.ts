import {
  addGenericBranchTrigger,
  addGenericBuildAction,
  addGenericCloudFormationDeployAction,
  emptyWorkflow,
} from '.';
import { StageDefinition, WorkflowDefinition } from '../models';

export function generate(
  defaultBranch = 'main',
  stages: StageDefinition[] = [],
  stackName: string,
  s3BucketName: string,
  buildRoleArn: string,
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

  stages.forEach(stage => {
    addGenericCloudFormationDeployAction(
      workflow,
      stage,
      `${stackName}-${stage.environment.title}`,
      region,
    );
  });
  return workflow;
}
