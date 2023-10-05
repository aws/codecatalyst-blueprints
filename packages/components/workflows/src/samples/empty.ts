import { ComputeType, ComputeFleet } from '../workflow/compute';
import { WorkflowDefinition } from '../workflow/workflow';

export function makeEmptyWorkflow(): WorkflowDefinition {
  return {
    Name: 'build',
    SchemaVersion: '1.0',
    Triggers: [],
    Compute: {
      Type: ComputeType.EC2,
      Fleet: ComputeFleet.LINUX_X86_64_LARGE,
    },
    Actions: {},
  };
}

export const emptyWorkflow = makeEmptyWorkflow();
