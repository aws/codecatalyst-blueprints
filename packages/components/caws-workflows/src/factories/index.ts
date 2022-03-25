import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { PullRequestEvent, Step, WorkflowDefinition } from '..';
import { ActionIdentifierAlias, getDefaultActionIdentifier } from '../actions';
// import * as samPython from './sam-python';

// export function generateWorkflow(
//   blueprint: Blueprint,
//   sdk: WorkflowRuntimeSdk,
//   defaultBranch = 'main',
//   stages: any[] = [],
//   stackName: string,
//   s3BucketName: string,
//   buildRoleArn: string,
//   tests: boolean,
//   stackRoleArn?: string,
// ): WorkflowDefinition {
//   console.log(blueprint, defaultBranch, stages, stackName, s3BucketName, buildRoleArn, tests, stackRoleArn);
//   switch (sdk) {
//     case 'sam-python':
//       return {} as any;
//     default:
//       throw new Error(`sdk is not supported: ${sdk}`);
//   }
// }

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
  roleArn: string,
  steps: Step[] = [],
  artifactName: string,
): string {
  const actionName = 'Build';
  workflow.Actions[actionName] = {
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.build, blueprint.context.environmentId),
    OutputArtifacts: [artifactName],
    Configuration: {
      Variables: [
        {
          Name: 'BUILD_ROLE_ARN',
          Value: roleArn,
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
  return actionName;
}

export function addGenericCloudFormationDeployAction(params: {
  blueprint: Blueprint;
  workflow: WorkflowDefinition;
  actionRoleArn: string;
  stackRoleArn: string;
  stackName: string;
  stackRegion: string;
  dependsOn: string;
  artifactName: string;
  actionName: string;
  environmentName: string;
}): string {
  const { blueprint, workflow, actionRoleArn, stackRoleArn, stackName, stackRegion, dependsOn, artifactName, actionName, environmentName } = params;
  workflow.Actions[actionName] = {
    DependsOn: [dependsOn],
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.deploy, blueprint.context.environmentId),
    InputArtifacts: [artifactName],
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
  };
  return actionName;
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
