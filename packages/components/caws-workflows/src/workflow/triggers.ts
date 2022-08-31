import { WorkflowDefinition } from './workflow';

export interface TriggerDefiniton {
  Type: TriggerType;
  Branches?: string[];
  Events?: PullRequestEvent[];
  SourceName?: string;
}

export enum TriggerType {
  MANUAL = 'MANUAL',
  PUSH = 'PUSH',
  PULLREQUEST = 'PULLREQUEST',
}

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

export enum PullRequestEvent {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  MERGED = 'MERGED',
  REVISION = 'REVISION',
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
