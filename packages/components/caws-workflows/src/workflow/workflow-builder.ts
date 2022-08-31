import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { TriggerDefiniton } from '..';
import { addGenericBuildAction, BuildActionParameters } from '../actions/action-build';
import { addGenericCloudFormationDeployAction, CfnDeployActionParameters } from '../actions/action-cfn-deploy';
import { addGenericTestReports, TestReportActionParameters } from '../actions/action-test-reports';
import { emptyWorkflow } from '../samples/empty';
import { addGenericBranchTrigger, addGenericPullRequestTrigger, PullRequestEvent } from './triggers';
import { WorkflowDefinition } from './workflow';

export class WorkflowBuilder {
  definition: WorkflowDefinition;
  blueprint: Blueprint;

  constructor(blueprint: Blueprint, workflowdefinition: WorkflowDefinition) {
    this.definition = {
      ...emptyWorkflow,
      ...workflowdefinition,
    };
    this.blueprint = blueprint;
  }

  getDefinition(): WorkflowDefinition {
    return this.definition;
  }
  setDefinition(definition: WorkflowDefinition): void {
    this.definition = definition;
  }

  addTrigger(trigger: TriggerDefiniton) {
    this.definition.Triggers = this.definition.Triggers || [];
    this.definition.Triggers.push(trigger);
  };

  addBranchTrigger(branches = ['main'], filesChanged?: string[]) {
    addGenericBranchTrigger(this.definition, branches, filesChanged);
  }

  addPullRequestTrigger(events: PullRequestEvent[], branches = ['main'], filesChanged?: string[]) {
    addGenericPullRequestTrigger(this.definition, events, branches, filesChanged);
  }

  addBuildAction(configuration: BuildActionParameters) {
    addGenericBuildAction({
      ...configuration,
      blueprint: this.blueprint,
      workflow: this.definition,
    });
  }

  addCfnDeployAction(configuration: CfnDeployActionParameters) {
    addGenericCloudFormationDeployAction({
      ...configuration,
      blueprint: this.blueprint,
      workflow: this.definition,
    });
  }

  addTestAction(configuration: TestReportActionParameters) {
    addGenericTestReports({
      ...configuration,
      blueprint: this.blueprint,
      workflow: this.definition,
    });
  }
}
