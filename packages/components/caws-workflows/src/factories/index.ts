import {
  StageDefinition,
  Step,
  WorkflowDefinition,
  WorkflowRuntimeLanguage as WorkflowRuntimeSdk,
} from '..';
import * as samPython from './sam-python';


const GENERIC_BUILD_IMAGE = 'aws-actions/cawsbuildprivate-build@v1';
const GENERIC_DEPLOY_IMAGE = 'aws/cloudformation-deploy@v1';
const DEFAULT_ARTIFACT_NAME = 'MyCustomBuildArtifactName';

export function generateWorkflow(
  sdk: WorkflowRuntimeSdk,
  defaultBranch = 'main',
  stages: StageDefinition[] = [],

  stackName: string,
  s3BucketName: string,
  buildRoleArn: string,
): WorkflowDefinition {
  switch (sdk) {
    case 'sam-python':
      return samPython.generate(defaultBranch, stages, stackName, s3BucketName, buildRoleArn);
    default:
      throw new Error(`sdk is not supported: ${sdk}`);
  }
}

export const emptyWorkflow: WorkflowDefinition = {
  Name: 'build',
  Triggers: [],
  Actions: {},
};

export function addGenericBranchTrigger(workflow: WorkflowDefinition, branch = 'main') {
  if (!workflow.Triggers) {
    workflow.Triggers = [];
  }

  workflow.Triggers.push({
    Type: 'Push',
    Branches: [branch],
  });
}

export function addGenericBuildAction(
  workflow: WorkflowDefinition,
  buildRoleArn: string,
  steps: Step[] = [],
) {
  workflow.Actions.Build = {
    Identifier: GENERIC_BUILD_IMAGE,
    OutputArtifacts: [DEFAULT_ARTIFACT_NAME],
    Configuration: {
      Variables: [
        {
          Name: 'BUILD_ROLE_ARN',
          Value: buildRoleArn,
        },
      ],
      Steps: steps,
      Artifacts: [
        {
          Name: DEFAULT_ARTIFACT_NAME,
          Files: ['output.yaml'],
        },
      ],
    },
  };
}

export function addGenericCloudFormationDeployAction(
  workflow: WorkflowDefinition,
  stage: StageDefinition,
  stackName: string,
  stackRegion: string,
) {
  workflow.Actions[`Deploy_${stage.environment.title}`] = {
    Identifier: GENERIC_DEPLOY_IMAGE,
    InputArtifacts: [DEFAULT_ARTIFACT_NAME],
    Configuration: {
      CodeAwsRoleARN: stage.role,
      StackRoleARN: stage.stackRoleArn,
      StackName: stackName,
      StackRegion: stackRegion,
      TemplatePath: `${DEFAULT_ARTIFACT_NAME}::output.yaml`,
      Uses: {
        Environment: stage.environment.title,
      },
    },
  };
}
