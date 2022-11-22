// Adding a sample deploy action
import { Blueprint, Options as ParentOptions } from '@caws-blueprint/blueprints.blueprint';
import { addGenericCdkDeployAction } from '../actions/action-cdk-deploy';
import { WorkflowDefinition } from '../workflow/workflow';

const typeCheck: ParentOptions = {
  outdir: '/test',
};

const workflowDefinition: WorkflowDefinition = {
  SchemaVersion: '1.0',
  Name: 'test',
};

addGenericCdkDeployAction(
  {
    blueprint: new Blueprint(typeCheck),
    workflow: workflowDefinition,
    actionName: 'DeployAction',
    environment: {
      Name: 'sample-env-name',
      Connections: [
        {
          Name: ' ',
          Role: ' ',
        },
      ],
    },
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
    configuration: {
      StackName: 'test-stack',
      Region: 'us-west-2',
      CfnOutputVariables: ['cdnout1', 'cdnout2'],
      Tags: { Tagkey1: 'value1', Tagkey2: 'value2', Tagkey3: 'value2' },
      Context: { Contextkey1: 'value1', Contextkey2: 'value1' },
      CdkRootPath: 'testing',
    },
  },
);