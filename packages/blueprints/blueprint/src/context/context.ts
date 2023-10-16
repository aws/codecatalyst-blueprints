import { TraversalOptions } from './traverse';
import { ContextFile } from '../resynthesis/context-file';

export interface NpmConfiguration {
  readonly registry?: string;
  readonly token?: string;
}

export interface PackageConfiguration {
  readonly name?: string;
  readonly version?: string;
}
/**
 * context about the existing project bundle (if it exists)
 */
export interface Project {
  readonly name?: string;
  bundlepath?: string;

  /**
   * The options used on the previous run of this blueprint.
   */
  options?: any;
  src: {
    /**
     * This can be used to list the repositories in the exisiting codebase.
     * @returns list of repository names
     */
    listRepositoryNames: () => string[];
    /**
     * traverses through the files under the bundlepath/src (if it exists). This allows you to find all the files in the exisiting codebase (and filter them too)
     * @param options options that allow you to narrow the files which you step through - defaults to ALL_FILES
     * @returns ContextFile
     */
    findAll: (options?: TraversalOptions) => ContextFile[];
  };
}

export type ResynthesisPhase = 'ANCESTOR' | 'PROPOSED' | 'RESYNTH';
export interface Context {
  readonly spaceName?: string;
  readonly environmentId?: string;

  /**
   * This represents which phase of (re)synthesis the blueprint is currently running under
   * Phase is one of three options:
   * 1. 'PROPOSED' - indicates that the blueprint is running with the intent of generating a new project.
   * This typically happens when a blueprint is being run with the intention of adding into a new project
   * or synthesizing a 'proposed' bundle.
   * 2. 'ANCESTOR' - indicates that a blueprint is running with the intent of generating an ancestor bundle
   * to help set up a diff set for resynthesis
   * 3. 'RESYNTH' - indicates that a blueprint is running with the intent of invoking the 'resynth()' function.
   * In this phase the synth() function is not executed.
   * @default 'PROPOSED'
   */
  readonly resynthesisPhase: ResynthesisPhase;
  /**
   * Requested BranchName. Typically used for overriding the branch names for resynthesis updates.
   */
  readonly branchName?: string;

  readonly rootDir: string;
  readonly npmConfiguration: NpmConfiguration;
  readonly package: PackageConfiguration;
  readonly project: Project;
}
