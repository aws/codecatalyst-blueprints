import { ComputeType, ComputeFleet } from '../workflow/compute';
import { WorkflowDefinition } from '../workflow/workflow';

export const emptyWorkflow: WorkflowDefinition = {
  Name: 'build',
  SchemaVersion: '1.0',
  Triggers: [],
  Compute: {
    Type: ComputeType.EC2,
    Fleet: ComputeFleet.LINUX_X86_64_LARGE,
  },
  Actions: {},
};
