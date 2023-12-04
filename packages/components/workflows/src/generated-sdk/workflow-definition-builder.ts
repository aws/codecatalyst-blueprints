import { Blueprint } from '@amazon-codecatalyst/blueprints.blueprint';
import * as sdk from '@aws/codecatalyst-workflows-sdk';
import { getDefaultActionIdentifier } from '../actions/action';

/**
 * This wraps the generated codecatalyst workflows sdk [@aws/codecatalyst-workflows-sdk].
 * @experimental - there may be backwards breaking model changes via @aws/codecatalyst-workflows-sdk
 */
export class WorkflowDefinitionBuilder {
  blueprint: Blueprint;
  genericBuilder: sdk.WorkflowDefinition;

  constructor(
    blueprint: Blueprint,
    options?: {
      starterDefinition?: Partial<sdk.Workflow>;
    },
  ) {
    const name = options?.starterDefinition?.Name || 'build-workflow';

    this.genericBuilder = new sdk.WorkflowDefinition(name, {
      workflow: options?.starterDefinition,
    });
    this.blueprint = blueprint;
  }

  setName(name: string) {
    this.genericBuilder.definition.Name = name;
  }

  getDefinition(): sdk.Workflow {
    return this.genericBuilder.definition;
  }

  setDefinition(definition: sdk.Workflow) {
    this.genericBuilder.definition = definition;
  }

  addAction<T extends sdk.Action>(name: string, action: T, _options?: {} | undefined): void {
    this.genericBuilder.addAction(name, {
      ...action,
      Identifier: getDefaultActionIdentifier(action.Identifier, this.blueprint.context.environmentId),
    });
  }

  addActionGroup<T extends sdk.ActionGroup>(name: string, actionGroup: T, _options?: {} | undefined): void {
    this.genericBuilder.addAction(name, {
      ...actionGroup,
    });
  }
}
