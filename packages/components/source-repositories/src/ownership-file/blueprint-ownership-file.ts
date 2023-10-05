import * as path from 'path';
import { Ownership } from '@amazon-codecatalyst/blueprints.blueprint';
import { SourceFile } from '../files/source-file';
import { SourceRepository } from '../repository';

/**
 * File in which we record ownership preferences and overrides
 */
export const BLUEPRINT_OWNERSHIP_FILE = Ownership.DEFAULT_FILE_NAME;
export interface BlueprintOwnershipFileDefinition extends Ownership {
  filePath?: string;
}

/**
 * Blueprint ownership file, lays out ownership delegation in a file in a repository.
 */
export class BlueprintOwnershipFile extends SourceFile {
  constructor(readonly sourceRepository: SourceRepository, options: BlueprintOwnershipFileDefinition) {
    const filepath = path.join(options.filePath ?? '', BLUEPRINT_OWNERSHIP_FILE);
    super(sourceRepository, filepath, Ownership.asString(sourceRepository.blueprint, options));
  }
}
