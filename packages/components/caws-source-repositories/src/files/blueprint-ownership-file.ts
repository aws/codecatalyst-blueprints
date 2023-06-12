import { Strategy } from '../lifecycle/models';
import { SourceRepository } from '../repository';
import { File } from './file';

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

/**
 * Generic undetermined file, takes a buffer, is written out at synthesis time.
 */
export class BlueprintOwnershipFile extends File {
  public static asString = (fileDefinition: BlueprintOwnershipFileDefinition): string => {
    // TODO implment me
    return JSON.stringify(fileDefinition);
  };

  public static asDefintion = (fileContent: string): BlueprintOwnershipFileDefinition => {
    // TODO implment me. throw if this is an invalid file
    console.log(fileContent);
    return {};
  };

  constructor(protected readonly sourceRepository: SourceRepository, options: BlueprintOwnershipFileDefinition) {
    super(sourceRepository, options.filePath || '', Buffer.from(BlueprintOwnershipFile.asString(options)));
  }
}
