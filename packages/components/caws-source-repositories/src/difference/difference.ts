import * as fs from 'fs';
import * as path from 'path';
import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { BUNDLE_PATH_SRC_DIFF } from '@caws-blueprint/blueprints.blueprint/lib/differences/differences';
import { SourceRepository } from '../repository';

export interface DifferenceOptions {
  /**
   * This is the target branch of the pull request. Branch will be created off default if it does not exist
   * @default main (or repository default branch)
   */
  targetBranch?: string;
}

export class Difference {
  public static BUNDLE_PATH = BUNDLE_PATH_SRC_DIFF;

  public readonly identifier: string;
  public readonly blueprint: Blueprint;
  public readonly repository: SourceRepository;
  public readonly originBranch: string;
  public readonly targetBranch?: string;

  /**
     *
     * @param sourceRepository the source repository the difference is against
     * @param originBranch This is the origin branch of the pull request. Branch will be created if it does not exist.
     * @param options
     */
  constructor(repository: SourceRepository, originBranch: string, options?: DifferenceOptions) {
    this.identifier = `${repository.title}-${originBranch}`;
    this.blueprint = repository.blueprint;
    this.repository = repository;
    this.originBranch = originBranch;
    this.targetBranch = options?.targetBranch;
  }

  /**
    * Takes a difference in patch format that can be applied directly across a fileset
    * @param id id of the patch, used as the filename. Can be used to break up the patches which make up a difference for easier viewing.
    * @param difference difference in patch format
    */
  addPatch(id: string, patch: string) {
    const filepath = path.join(this.blueprint.context.rootDir, Difference.BUNDLE_PATH, this.identifier, id);
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, patch);
  }
}