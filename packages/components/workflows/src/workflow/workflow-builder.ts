import { Blueprint } from '@amazon-codecatalyst/blueprints.blueprint';
import { addGenericBranchTrigger, addGenericPullRequestTrigger, PullRequestEvent } from './triggers';
import { WorkflowDefinition } from './workflow-definition';
import { ComputeDefintion, TriggerDefiniton } from '..';
import { addGenericBuildAction, BuildActionParameters } from '../actions/action-build';
import { addGenericCdkBootstrapAction, CdkBootstrapActionParameters } from '../actions/action-cdk-bootstrap';
import { addGenericCdkDeployAction, CdkDeployActionParameters } from '../actions/action-cdk-deploy';
import { addGenericCloudFormationCleanupAction, CfnCleanupActionParameters } from '../actions/action-cfn-cleanup';
import { addGenericCloudFormationDeployAction, CfnDeployActionParameters } from '../actions/action-cfn-deploy';
import { addGenericPublishBlueprintAction, PublishBlueprintActionParameters } from '../actions/action-publish-blueprint';
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

  addTrigger(trigger: TriggerDefiniton): WorkflowBuilder {
    this.definition.Triggers = this.definition.Triggers || [];
    this.definition.Triggers.push(trigger);
    return this;
  }

  addCompute(compute: ComputeDefintion): WorkflowBuilder {
    this.definition.Compute = this.definition.Compute || compute;
    return this;
  }

  addBranchTrigger(branches = ['main'], filesChanged?: string[]): WorkflowBuilder {
    addGenericBranchTrigger(this.definition, branches, filesChanged);
    return this;
  }

  addPullRequestTrigger(events: PullRequestEvent[], branches = ['main'], filesChanged?: string[]): WorkflowBuilder {
    addGenericPullRequestTrigger(this.definition, events, branches, filesChanged);
    return this;
  }

  addBuildAction(configuration: BuildActionParameters): WorkflowBuilder {
    addGenericBuildAction({
      ...configuration,
      blueprint: this.blueprint,
      workflow: this.definition,
    });
    return this;
  }

  addCfnDeployAction(configuration: CfnDeployActionParameters): WorkflowBuilder {
    addGenericCloudFormationDeployAction({
      ...configuration,
      blueprint: this.blueprint,
      workflow: this.definition,
    });
    return this;
  }

  addCfnCleanupAction(configuration: CfnCleanupActionParameters): WorkflowBuilder {
    addGenericCloudFormationCleanupAction({
      ...configuration,
      blueprint: this.blueprint,
      workflow: this.definition,
    });
    return this;
  }

  addCdkDeployAction(configuration: CdkDeployActionParameters): WorkflowBuilder {
    addGenericCdkDeployAction({
      ...configuration,
      blueprint: this.blueprint,
      workflow: this.definition,
    });
    return this;
  }

  addCdkBootstrapAction(configuration: CdkBootstrapActionParameters): WorkflowBuilder {
    addGenericCdkBootstrapAction({
      ...configuration,
      blueprint: this.blueprint,
      workflow: this.definition,
    });
    return this;
  }

  addTestAction(configuration: TestReportActionParameters): WorkflowBuilder {
    addGenericTestReports({
      ...configuration,
      blueprint: this.blueprint,
      workflow: this.definition,
    });
    return this;
  }

  addPublishBlueprintAction(configuration: PublishBlueprintActionParameters): WorkflowBuilder {
    addGenericPublishBlueprintAction({
      ...configuration,
      blueprint: this.blueprint,
      workflow: this.definition,
    });
    return this;
  }

  addGenericAction<
    T extends {
      ActionName: string;
    },
  >(configuration: T & any): WorkflowBuilder {
    this.definition.Actions = this.definition.Actions || {};
    const actionName = configuration.actionName;
    delete configuration.actionName;
    this.definition.Actions[actionName] = configuration;
    return this;
  }
}
