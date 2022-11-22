// Adding a sample bootstrap action
import { Blueprint, Options as ParentOptions } from '@caws-blueprint/blueprints.blueprint';
import { addGenericCdkBootstrapAction } from '../actions/action-cdk-bootstrap';
import { WorkflowDefinition } from '../workflow/workflow';

const typeCheck: ParentOptions = {
  outdir: '/test',
};

const workflowDefinition: WorkflowDefinition = {
  SchemaVersion: '1.0',
  Name: 'test',
};

addGenericCdkBootstrapAction(
  {
    blueprint: new Blueprint(typeCheck),
    workflow: workflowDefinition,
    actionName: 'BootstrapAction',
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
          Name: 'cdkBootstrap.ouy',
          Files: ['**/*'],
        },
      ],
    },
    configuration: {
      Region: 'us-west-2',
    },
  },
);