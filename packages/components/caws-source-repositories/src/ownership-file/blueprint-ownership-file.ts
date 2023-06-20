import * as path from 'path';
import { Blueprint, Ownership } from '@caws-blueprint/blueprints.blueprint';
import { File } from '../files/file';
import { MergeStrategies } from '../lifecycle/merge-strategy';
import { Strategy } from '../lifecycle/models';
import { SourceRepository } from '../repository';

/**
 * File in which we record ownership preferences and overrides
 */
export const BLUEPRINT_OWNERSHIP_FILE = 'blueprint.ownership';

export interface BlueprintOwnershipFileDefinition {
  filePath?: string;

  /**
   * This controls how files are merged when a user runs re-synthesis.
   *
   * Resynthesis is typically run when an update to a blueprint results in bug fixes or other changes in generated code.
   * This will result in a depend-a-bot style PR into customer generated codebases.
   *
   * You should assume that the same or similar options are passed during resynthesis, if the options diverge too much,
   * (e.g. changing the language) it might not be possible to effectively reason about needed changes. This might still
   * result in a valid synthesis, but will likely require the customer to do some work to manually fix merge conflicts.
   *
   * This can also happen if the blueprint interface adds backwards breaking changes to it's shape, prior used options
   * will no longer work.
   */
  resynthesis?: {
    strategies: Strategy[];
  };
}

export class BlueprintOwnershipFileSyntaxError extends Error {
  lineNumber: number;

  constructor(message: string, lineNumber: number) {
    super(`Error parsing blueprint ownership file: line ${lineNumber}: ${message}`);
    this.lineNumber = lineNumber;
  }
}

/**
 * Blueprint ownership file, lays out ownership delegation in a repository.
 */
export class BlueprintOwnershipFile extends File {

  constructor(protected readonly sourceRepository: SourceRepository, options: BlueprintOwnershipFileDefinition) {
    super(
      sourceRepository,
      path.join(options.filePath ?? '', BLUEPRINT_OWNERSHIP_FILE),
      Buffer.from(Ownership.asString(sourceRepository.blueprint, options)),
    );
  }
}
