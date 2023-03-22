import { WorkflowDefinition } from './workflow';
export interface ComputeDefintion {
  Type: ComputeType;
  Fleet: ComputeFleet;
  //todo add other compute variables
}

export enum ComputeType {
  LAMBDA = 'Lambda',
  EC2 = 'EC2',
}

export enum ComputeFleet {
  LINUX_X86_64_LARGE = 'Linux.x86-64.Large',
  LINUX_X86_64_XLARGE = 'Linux.x86-64.XLarge',
  LINUX_ARM_64_LARGE = 'Linux.Arm64.Large',
  LINUX_ARM_64_XLARGE = 'Linux.Arm64.XLarge',
  LINUX_ARM_64_2XLARGE = 'Linux.Arm64.2XLarge'
}

export function addGenericCompute(
  workflow: WorkflowDefinition,
  type: ComputeType,
  fleet: ComputeFleet,
  //todo add more variables based on compute definition
) {
  const computeDefintion: ComputeDefintion = {
    Type: type,
    Fleet: fleet,
  };
  workflow.Compute = computeDefintion;
}
