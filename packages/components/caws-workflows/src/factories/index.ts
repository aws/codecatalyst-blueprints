import {
  StageDefinition,
  Step,
  WorkflowDefinition,
  WorkflowRuntimeLanguage as WorkflowRuntimeSdk,
} from '..';
import * as samPython from './sam-python';


const GENERIC_BUILD_IMAGE = 'aws-actions/cawsbuildprivate-build@v1';
const GENERIC_TEST_IMAGE = 'aws-actions/cawstestbeta-test@v1';
const GENERIC_DEPLOY_IMAGE = 'aws/cloudformation-deploy-gamma@v1';
const DEFAULT_ARTIFACT_NAME = 'MyCustomBuildArtifactName';

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
  dependsOn: string,
) {
  workflow.Actions[`Deploy_${stage.environment.title}`] = {
    DependsOn: [dependsOn],
    Identifier: GENERIC_DEPLOY_IMAGE,
    InputArtifacts: [DEFAULT_ARTIFACT_NAME],
    Configuration: {
      CodeAwsRoleARN: stage.role,
      StackRoleARN: stage.stackRoleArn,
      StackName: stackName,
      StackRegion: stackRegion,
      TemplatePath: `${DEFAULT_ARTIFACT_NAME}::output.yaml`,
      EnvironmentName: stage.environment.title,
      Parameters: [],
      RollbackConfiguration: {
        MonitorAlarmARNs: [],
      },
    },
  };
}

export function addGenericTestReports(workflow: WorkflowDefinition, steps: Step[]) {
  workflow.Actions.Test = {
    DependsOn: ['Build'],
    Identifier: GENERIC_TEST_IMAGE,
    OutputArtifacts: ['CoverageArtifact', 'TestArtifact'],
    Configuration: {
      Steps: steps,
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
          TestResults: [
            {
              ReferenceArtifact: 'CoverageArtifact',
              Format: 'CoberturaXml',
            },
          ],
        },
        {
          Name: 'TestArtifact',
          TestResults: [
            {
              ReferenceArtifact: 'TestArtifact',
              Format: 'JunitXml',
            },
          ],
        },
      ],
    },
  };
}
