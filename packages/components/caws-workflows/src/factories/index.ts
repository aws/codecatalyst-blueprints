import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import {
  CfnStageDefinition,
  PullRequestEvent,
  StageDefinition,
  Step,
  WorkflowDefinition,
  WorkflowRuntimeLanguage as WorkflowRuntimeSdk,
  TriggerType,
} from '..';
import { ActionIdentifierAlias, getDefaultActionIdentifier } from '../actions';
import * as samPython from './sam-python';


export function generateWorkflow(
  blueprint: Blueprint,
  sdk: WorkflowRuntimeSdk,
  defaultBranch = 'main',
  stages: StageDefinition[] = [],
  stackName: string,
  s3BucketName: string,
  buildRoleArn: string,
  tests: boolean,
  stackRoleArn?: string,
): WorkflowDefinition {
  switch (sdk) {
    case 'sam-python':
      return samPython.generate(
        blueprint,
        defaultBranch,
        stages,
        stackName,
        s3BucketName,
        buildRoleArn,
        tests,
        stackRoleArn!,
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
export function addGenericBranchTrigger(
  workflow: WorkflowDefinition,
  branches = ['main'],
  filesChanged?: string[],
) {
  if (!workflow.Triggers) {
    workflow.Triggers = [];
  }

  workflow.Triggers.push({
    Type: TriggerType.PUSH,
    Branches: branches,
    ...(filesChanged && { FileChanged: filesChanged }),
  });
}

export function addGenericPullRequestTrigger(
  workflow: WorkflowDefinition,
  events: PullRequestEvent[],
  branches = ['main'],
  filesChanged?: string[],
) {
  if (!workflow.Triggers) {
    workflow.Triggers = [];
  }

  workflow.Triggers.push({
    Type: TriggerType.PULLREQUEST,
    Events: events,
    Branches: branches,
    ...(filesChanged && { FileChanged: filesChanged }),
  });
}

export function addGenericBuildAction(
  blueprint: Blueprint,
  workflow: WorkflowDefinition,
  buildRoleArn: string,
  steps: Step[] = [],
  artifactName: string,
) {
  workflow.Actions.Build = {
    Identifier: getDefaultActionIdentifier(
      ActionIdentifierAlias.build,
      blueprint.context.environmentId,
    ),
    Inputs: {
      Variables: [
        {
          Name: 'BUILD_ROLE_ARN',
          Value: buildRoleArn,
        },
      ],
      Sources: ['WorkfloSource'],
    },
    Outputs: {
      Artifacts: [
        {
          Name: artifactName,
          Files: 'output.yaml',
        },
      ],

      AutoDiscoverReports: [{
        Enabled: true,
        ReportNamePrefix: 'AutoDiscovered',
        IncludePaths: '**/*',
      }],
    },
    Configuration: {
      Steps: steps,
    },
  };
}

export function addGenericCloudFormationDeployAction(
  blueprint: Blueprint,
  workflow: WorkflowDefinition,
  stage: CfnStageDefinition,
  stackName: string,
  stackRegion: string,
  dependsOn: string,
  artifactName: string,
) {
  workflow.Actions[`Deploy_${stage.environment.title}`] = {
    DependsOn: [dependsOn],
    Identifier: getDefaultActionIdentifier(
      ActionIdentifierAlias.deploy,
      blueprint.context.environmentId,
    ),
    Inputs: {
      Artifacts: [artifactName],
      Variables: [
        {
          Name: 'Account Id',
          Value: stage.accountid,
        },
        {
          Name: 'Region',
          Value: stage.region,
        },
      ],
    },
    Configuration: {
      ActionRoleArn: stage.role,
      DeploymentEnvironment: stage.environment.title,
      Parameters: {
        'name': stackName,
        'region': stackRegion,
        'role-arn': stage.stackRoleArn,
        'template': './output.yaml',
        'capabilities': 'CAPABILITY_AUTO_EXPAND,CAPABILITY_IAM',
      },
    },
    Environment: {
      Name: stage.environment.title,
      Connections: [{
        Name: stage.accountid,
        Role: stage.role,
      }],
    },
  };
}

export function addGenericTestReports(
  blueprint: Blueprint,
  workflow: WorkflowDefinition,
  steps: Step[],
  coverageArtifactName: string,
  testArtifactName: string,
) {
  workflow.Actions.Test = {
    DependsOn: ['Build'],
    Identifier: getDefaultActionIdentifier(
      ActionIdentifierAlias.test,
      blueprint.context.environmentId,
    ),
    Outputs: {
      Artifacts: [
        {
          Name: coverageArtifactName,
          Files: 'reports/cov.xml',
        },
        {
          Name: testArtifactName,
          Files: 'reports/report.xml',
        },
      ],
      Reports: [coverageArtifactName, testArtifactName],
    },
    Configuration: {
      Steps: steps,
    },
  };
}
