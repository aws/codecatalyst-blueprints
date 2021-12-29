import {
  CfnStageDefinition,
  StageDefinition,
  Step,
  WorkflowDefinition,
  WorkflowRuntimeLanguage as WorkflowRuntimeSdk,
  PullRequestEvent,
} from '..';
import * as samPython from './sam-python';


const GENERIC_BUILD_IMAGE = 'aws-actions/cawsbuildprivate-build@v1';
const GENERIC_TEST_IMAGE = 'aws-actions/cawstestbeta-test@v1';
const GENERIC_DEPLOY_IMAGE = 'aws/cloudformation-deploy-gamma@v1';

export function generateWorkflow(
  sdk: WorkflowRuntimeSdk,
  defaultBranch = 'main',
  stages: StageDefinition[] = [],

  stackName: string,
  s3BucketName: string,
  buildRoleArn: string,

  tests: boolean,
): WorkflowDefinition {
  switch (sdk) {
    case 'sam-python':
      return samPython.generate(
        defaultBranch,
        stages,
        stackName,
        s3BucketName,
        buildRoleArn,
        tests,
      );
    default:
      throw new Error(`sdk is not supported: ${sdk}`);
  }
}

export const emptyWorkflow: WorkflowDefinition = {
  Name: 'build',
  Triggers: [],
  Actions: {},
};

//todo: change branches to branch and include optional files changed parameter
export function addGenericBranchTrigger(workflow: WorkflowDefinition, branches = ['main'], filesChanged?: string[]) {
  if (!workflow.Triggers) {
    workflow.Triggers = [];
  }

  workflow.Triggers.push({
    Type: 'Push',
    Branches: branches,
    ...(filesChanged && { FileChanged: filesChanged }),
  });
}

export function addGenericPullRequestTrigger(workflow: WorkflowDefinition, events: PullRequestEvent[], branches = ['main'], filesChanged?: string[]) {
  if (!workflow.Triggers) {
    workflow.Triggers = [];
  }

  workflow.Triggers.push({
    Type: 'PullRequest',
    Events: events,
    Branches: branches,
    ...(filesChanged && { FileChanged: filesChanged }),
  });
}

export function addGenericBuildAction(
  workflow: WorkflowDefinition,
  buildRoleArn: string,
  steps: Step[] = [],
  artifactName: string,
) {
  workflow.Actions.Build = {
    Identifier: GENERIC_BUILD_IMAGE,
    OutputArtifacts: [artifactName],
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
          Name: artifactName,
          Files: ['output.yaml'],
        },
      ],
    },
  };
}

export function addGenericCloudFormationDeployAction(
  workflow: WorkflowDefinition,
  stage: CfnStageDefinition,
  stackName: string,
  stackRegion: string,
  dependsOn: string,
  artifactName: string,
) {
  workflow.Actions[`Deploy_${stage.environment.title}`] = {
    DependsOn: [dependsOn],
    Identifier: GENERIC_DEPLOY_IMAGE,
    InputArtifacts: [artifactName],
    Configuration: {
      CodeAwsRoleARN: stage.role,
      StackRoleARN: stage.stackRoleArn,
      StackName: stackName,
      StackRegion: stackRegion,
      TemplatePath: `${artifactName}::output.yaml`,
      EnvironmentName: stage.environment.title,
      Parameters: [],
      RollbackConfiguration: {
        MonitorAlarmARNs: [],
      },
    },
  };
}

export function addGenericTestReports(workflow: WorkflowDefinition, steps: Step[], coverageArtifactName: string, testArtifactName: string) {
  workflow.Actions.Test = {
    DependsOn: ['Build'],
    Identifier: GENERIC_TEST_IMAGE,
    OutputArtifacts: [coverageArtifactName, testArtifactName],
    Configuration: {
      Steps: steps,
      Artifacts: [
        {
          Name: coverageArtifactName,
          Files: ['reports/cov.xml'],
        },
        {
          Name: testArtifactName,
          Files: ['reports/report.xml'],
        },
      ],
      Reports: [
        {
          Name: coverageArtifactName,
          TestResults: [
            {
              ReferenceArtifact: coverageArtifactName,
              Format: 'CoberturaXml',
            },
          ],
        },
        {
          Name: testArtifactName,
          TestResults: [
            {
              ReferenceArtifact: testArtifactName,
              Format: 'JunitXml',
            },
          ],
        },
      ],
    },
  };
}
