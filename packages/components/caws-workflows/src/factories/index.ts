import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { CfnStageDefinition, PullRequestEvent, Step, WorkflowDefinition } from '..';
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
  blueprint: Blueprint,
  workflow: WorkflowDefinition,
  buildRoleArn: string,
  steps: Step[] = [],
  artifactName: string,
) {
  workflow.Actions.Build = {
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.build, blueprint.context.environmentId),
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
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.deploy, blueprint.context.environmentId),
    InputArtifacts: [artifactName],
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
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.test, blueprint.context.environmentId),
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
