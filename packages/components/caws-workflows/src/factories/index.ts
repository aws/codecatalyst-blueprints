import { PullRequestEvent, WorkflowDefinition, TriggerType } from '..';

export const emptyWorkflow: WorkflowDefinition = {
  Name: 'build',
  SchemaVersion: '1.0',
  Triggers: [],
  Actions: {},
};

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
