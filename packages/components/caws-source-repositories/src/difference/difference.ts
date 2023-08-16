import * as fs from 'fs';
import * as path from 'path';
import { BUNDLE_PATH_SRC_DIFF } from '@caws-blueprint/blueprints.blueprint/lib/differences/differences';
import { Component } from 'projen';
import { SourceRepository } from '../repository';

export interface DifferenceOptions {
  /**
   * This is the target branch of the pull request. Branch will be created off default if it does not exist
   * @default main (or repository default branch)
   */
  targetBranch?: string;
}

export class Difference extends Component {
  public static BUNDLE_PATH = BUNDLE_PATH_SRC_DIFF;

  public readonly identifier: string;
  public readonly targetBranch?: string;
  public patches: {
    filepath: string;
    filecontent: string;
  }[];

  /**
     *
     * @param sourceRepository the source repository the difference is against
     * @param originBranch This is the origin branch of the pull request. Branch will be created if it does not exist.
     * @param options
     */
  constructor(
    readonly repository: SourceRepository,
    readonly originBranch: string,
    readonly options?: DifferenceOptions,
  ) {
    super(repository.blueprint);

    this.identifier = `${repository.title}-${originBranch}`;
    this.targetBranch = options?.targetBranch;
    this.patches = [];
  }

  /**
    * Takes a difference in patch format that can be applied directly across a fileset
    * @param id id of the patch, used as the filename. Can be used to break up the patches which make up a difference for easier viewing.
    * @param difference difference in patch format
    */
  addPatch(id: string, patch: string) {
    const filepath = path.join(this.repository.blueprint.context.rootDir, Difference.BUNDLE_PATH, this.identifier, id);
    this.patches.push({
      filepath,
      filecontent: patch,
    });
  };

  synthesize(): void {
    this.patches.forEach(patch => {
      fs.mkdirSync(path.dirname(patch.filepath), { recursive: true });
      fs.writeFileSync(patch.filepath, patch.filecontent);
    });
  }
}