import { Environment } from '@amazon-codecatalyst/blueprint-component.environments';
import { WorkflowBuilder, convertToWorkflowEnvironment } from '@amazon-codecatalyst/blueprint-component.workflows';
import { Blueprint as ParentBlueprint } from '@amazon-codecatalyst/blueprints.blueprint';
import { Options } from './blueprint';

const cdkVersion = '2.121.1';

export const getDeploymentWorkflow = (blueprint: ParentBlueprint, options: Options, environment: Environment): WorkflowBuilder => {
  const workflowEnvironment = convertToWorkflowEnvironment(environment);

  const bootstrapRegions = new Set<string>([
    options.code.region as string,
    'us-east-1', // WAF is always deployed to us-east-1
  ]);

  const workflowBuilderDev = new WorkflowBuilder(blueprint);
  workflowBuilderDev.setName('cdk-workflow');

  const bootstrapActions: string[] = [];
  for (const region of bootstrapRegions) {
    const actionName = `bootstrap-${region}`.replace(/-/gi, '_');
    bootstrapActions.push(actionName);
    workflowBuilderDev.addCdkBootstrapAction({
      actionName,
      inputs: {
        Sources: ['WorkflowSource'],
      },
      configuration: {
        Region: region,
      },
      computeName: {
        Type: 'EC2',
      },
      environment: workflowEnvironment!,
    });
  }

  const workflow = workflowBuilderDev
    .addBranchTrigger(['main'])
    .addBuildAction({
      actionName: 'PullSource',
      input: {
        Sources: ['WorkflowSource'],
      },
      output: {
        Artifacts: [
          {
            Name: 'source_result',
            Files: ['**/*'],
          },
        ],
      },
      steps: [],
    })
    .addBuildAction({
      actionName: 'BuildFrontend',
      input: {
        Sources: [],
        Artifacts: ['source_result'],
      },
      output: {
        Artifacts: [
          {
            Name: 'frontend',
            Files: ['**/*'],
          },
        ],
      },
      container: {
        Registry: 'ECR',
        Image: 'public.ecr.aws/amazonlinux/amazonlinux:2023',
      },
      steps: ['dnf install -y nodejs', 'cd frontend', 'npm i'],
      dependsOn: ['PullSource'],
    })
    .addCdkDeployAction({
      actionName: 'CDKDeployAction',
      inputs: {
        Sources: [],
        Artifacts: ['frontend'],
      },
      configuration: {
        Region: options.code.region as string,
        StackName: options.code.stackName as string,
        CfnOutputVariables: ['FrontendURL'],
      },
      dependsOn: [...bootstrapActions, 'BuildFrontend'],
      computeName: {
        Type: 'EC2',
      },
      environment: workflowEnvironment!,
    });

  const upgradeCdkActions = [
    ...bootstrapActions,
    'CDKDeployAction',
  ];

  for (const actionName of upgradeCdkActions) {
    const action = workflow.getDefinition()?.Actions?.[actionName];
    if (action) {
      workflow.getDefinition()!.Actions![actionName]! = {
        ...action,
        Configuration: {
          ...action.Configuration,
          CdkCliVersion: cdkVersion,
        },
      };
    }
  }

  return workflow;
};
