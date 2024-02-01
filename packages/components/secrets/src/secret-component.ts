import * as crypto from 'crypto';
import { Blueprint, BlueprintSynthesisErrorTypes } from '@amazon-codecatalyst/blueprints.blueprint';
import { Component, YamlFile } from 'projen';
import { SecretDefinition } from './secret-definition';

function hash(string: string) {
  return crypto.createHash('sha256').update(string).digest('hex');
}

/**
 * Generates a seeded entropy string of a max 5 length
 * @param length number: max 10
 * @returns string
 */
const getHashedEntropy = (length: number, str: string) => hash(str).slice(2, 2 + (length || 5));

export class Secret extends Component {
  name: string;
  description?: string;

  constructor(blueprint: Blueprint, secret: SecretDefinition) {
    super(blueprint);
    this.name = secret.name;
    this.description = secret.description;

    const nameRegex = /^[a-zA-Z0-9]+(?:[-_][a-zA-Z0-9]+)*$/;

    if (this.name) {
      if (!nameRegex.test(this.name)) {
        blueprint.throwSynthesisError({
          name: BlueprintSynthesisErrorTypes.ValidationError,
          message: 'Secret name must contain only alphanumeric characters and the characters _- and cannot start or end with special characters.',
        });
      }

      if (this.name.length < 3) {
        blueprint.throwSynthesisError({
          name: BlueprintSynthesisErrorTypes.ValidationError,
          message: 'Secret name must have a minimum of 3 characters.',
        });
      }

      if (this.name.length > 255) {
        blueprint.throwSynthesisError({
          name: BlueprintSynthesisErrorTypes.ValidationError,
          message: 'Secret name must have a maximum of 255 characters.',
        });
      }

      if (this.description && this.description.length > 1000) {
        blueprint.throwSynthesisError({
          name: BlueprintSynthesisErrorTypes.ValidationError,
          message: 'Secret description must have a maxmimum of 1000 characters.',
        });
      }

      const shortName = this.name.slice(0, 5);

      new YamlFile(blueprint, `secrets/${shortName}-${getHashedEntropy(5, shortName)}.yaml`, {
        readonly: false,
        marker: false,
        obj: secret,
      });
    }
  }
}
