import { Blueprint } from '@amazon-codecatalyst/blueprints.blueprint';
import * as sdk from '@aws/codecatalyst-workflows-sdk';
import { getDefaultActionIdentifier } from '../actions/action';

/**
 * This wraps the generated codecatalyst workflows sdk [@aws/codecatalyst-workflows-sdk].
 * @experimental
 */
export class ActionGroupDefinitionBuilder {
  blueprint: Blueprint;
  definition: sdk.ActionGroup;

  constructor(
    blueprint: Blueprint,
    options: {
      starterDefinition?: Partial<sdk.ActionGroup>;
    },
  ) {
    this.blueprint = blueprint;
    this.definition = {
      ...options.starterDefinition,
      Actions: {},
    };
  }

  setDependsOn(dependsOn: string[]) {
    this.definition.DependsOn = dependsOn;
  }

  addAction<T extends sdk.Action>(name: string, action: T, _options?: {} | undefined): void {
    this.definition.Actions = this.definition.Actions || {};
    this.definition.Actions[name] = {
      ...action,
      Identifier: getDefaultActionIdentifier(action.Identifier, this.blueprint.context.environmentId) as any,
    };
  }
}
