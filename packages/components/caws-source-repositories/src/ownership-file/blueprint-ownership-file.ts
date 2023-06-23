import * as path from 'path';
import { Ownership } from '@caws-blueprint/blueprints.blueprint';
import { File } from '../files/file';
import { SourceRepository } from '../repository';

/**
 * File in which we record ownership preferences and overrides
 */
export const BLUEPRINT_OWNERSHIP_FILE = Ownership.DEFAULT_FILE_NAME;
export interface BlueprintOwnershipFileDefinition extends Ownership {
  filePath?: string;
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
