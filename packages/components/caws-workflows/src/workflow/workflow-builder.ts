import { Blueprint } from '@amazon-codecatalyst/blueprints.blueprint';
import { addGenericBranchTrigger, addGenericPullRequestTrigger, PullRequestEvent } from './triggers';
import { WorkflowDefinition } from './workflow';
import { ComputeDefintion, TriggerDefiniton } from '..';
import { addGenericBuildAction, BuildActionParameters } from '../actions/action-build';
import { addGenericCdkBootstrapAction, CdkBootstrapActionParameters } from '../actions/action-cdk-bootstrap';
import { addGenericCdkDeployAction, CdkDeployActionParameters } from '../actions/action-cdk-deploy';
import { addGenericCloudFormationCleanupAction, CfnCleanupActionParameters } from '../actions/action-cfn-cleanup';
import { addGenericCloudFormationDeployAction, CfnDeployActionParameters } from '../actions/action-cfn-deploy';
import { addGenericTestReports, TestReportActionParameters } from '../actions/action-test-reports';

export class WorkflowBuilder {
  definition: WorkflowDefinition;
  blueprint: Blueprint;

  constructor(blueprint: Blueprint, workflowdefinition?: WorkflowDefinition) {
    this.definition = {
      Name: 'build',
      SchemaVersion: '1.0',
      Triggers: [],
      Actions: {},
      ...workflowdefinition,
    };
    this.blueprint = blueprint;
  }

  setName(name: string) {
    this.definition.Name = name;
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
  }

  addCompute(compute: ComputeDefintion) {
    this.definition.Compute = this.definition.Compute || compute;
  }

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

  addCfnCleanupAction(configuration: CfnCleanupActionParameters) {
    addGenericCloudFormationCleanupAction({
      ...configuration,
      blueprint: this.blueprint,
      workflow: this.definition,
    });
  }

  addCdkDeployAction(configuration: CdkDeployActionParameters) {
    addGenericCdkDeployAction({
      ...configuration,
      blueprint: this.blueprint,
      workflow: this.definition,
    });
  }

  addCdkBootstrapAction(configuration: CdkBootstrapActionParameters) {
    addGenericCdkBootstrapAction({
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
