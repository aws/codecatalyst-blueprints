// Adding a sample deploy action
import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { addGenericCdkDeployAction, CdkDeployActionConfiguration } from '../actions/action-cdk-deploy';
import { WorkflowEnvironment } from '../environment/workflow-environment';

export const makeCDKDeployWorkflow = (
  blueprint: Blueprint,
  environment: WorkflowEnvironment,
  options?: {
    cdkDeployActionConfiguration?: CdkDeployActionConfiguration;
    workflowName?: string;
  },
) => {
  const startingWorkflowDefinition = {
    SchemaVersion: '1.0',
    Name: 'sample-cdk-deploy',
    Triggers: [],
  };

  return addGenericCdkDeployAction({
    blueprint,
    workflow: startingWorkflowDefinition,
    actionName: 'DeployAction',
    environment,
    inputs: {
      Sources: ['WorkflowSource'],
    },
    outputs: {
      AutoDiscoverReports: {
        Enabled: true,
        ReportNamePrefix: 'rpt',
      },
      Artifacts: [
        {
          Name: 'cdkDeploy.out',
          Files: ['**/*'],
        },
      ],
    },
    configuration: options?.cdkDeployActionConfiguration || {
      StackName: 'test-stack',
      Region: 'us-west-2',
      CfnOutputVariables: ['cdnout1', 'cdnout2'],
      Tags: { Tagkey1: 'value1', Tagkey2: 'value2', Tagkey3: 'value2' },
      Context: { Contextkey1: 'value1', Contextkey2: 'value1' },
      CdkRootPath: 'testing',
    },
  });
};
