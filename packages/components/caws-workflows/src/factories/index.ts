import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { PullRequestEvent, Step, WorkflowDefinition, TriggerType } from '..';
import { ActionIdentifierAlias, getDefaultActionIdentifier } from '../actions';

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
    Type: TriggerType.PUSH,
    Branches: branches,
    ...(filesChanged && { FileChanged: filesChanged }),
  });
}

export function addGenericPullRequestTrigger(workflow: WorkflowDefinition, events: PullRequestEvent[], branches = ['main'], filesChanged?: string[]) {
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
  roleArn: string,
  steps: Step[] = [],
  artifactName: string,
): string {
  const actionName = 'Build';
  workflow.Actions[actionName] = {
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.build, blueprint.context.environmentId),
    Inputs: {
      Variables: [
        {
          Name: 'BUILD_ROLE_ARN',
          Value: roleArn,
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

      AutoDiscoverReports: [
        {
          Enabled: true,
          ReportNamePrefix: 'AutoDiscovered',
          IncludePaths: '**/*',
        },
      ],
    },
    Configuration: {
      Steps: steps,
    },
  };
  return actionName;
}

export function addGenericCloudFormationDeployAction(params: {
  blueprint: Blueprint;
  workflow: WorkflowDefinition;
  actionRoleArn: string;
  stackRoleArn: string;
  stackName: string;
  stackRegion: string;
  dependsOn: string[];
  artifactName: string;
  actionName: string;
  environmentName: string;
}): string {
  const { blueprint, workflow, actionRoleArn, stackRoleArn, stackName, stackRegion, dependsOn, artifactName, actionName, environmentName } = params;
  workflow.Actions[actionName] = {
    DependsOn: dependsOn,
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.deploy, blueprint.context.environmentId),
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.deploy, blueprint.context.environmentId),
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
      ActionRoleArn: actionRoleArn,
      DeploymentEnvironment: environmentName,
      Parameters: {
        'name': stackName,
        'region': stackRegion,
        'role-arn': stackRoleArn,
        'template': './output.yaml',
        'capabilities': 'CAPABILITY_AUTO_EXPAND,CAPABILITY_IAM',
      },
    },
    Environment: {
      Name: stage.environment.title,
      Connections: [
        {
          Name: stage.accountid,
          Role: stage.role,
        },
      ],
    },
  };
  return actionName;
}

export function addGenericTestReports(params: {
  blueprint: Blueprint;
  workflow: WorkflowDefinition;
  steps: Step[];
  coverageArtifactName: string;
  testArtifactName: string;
  dependsOn: string[];
}) {
  const { blueprint, workflow, steps, coverageArtifactName, testArtifactName, dependsOn } = params;
  const actionName = 'Test';
  workflow.Actions[actionName] = {
    DependsOn: dependsOn,
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.test, blueprint.context.environmentId),
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
