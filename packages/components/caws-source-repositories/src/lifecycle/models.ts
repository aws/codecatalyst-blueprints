/**
 * Lifecycle control over a repository allows a blueprint to reason about which files should and should not exist after a resynthesis.
 *
 * If any of these options are set, the blueprint will write a 'blueprint.lifecycle.overrides' ini file at the root of the repository
 * recording these options and allowing the user to make updates to that ini file to manually override in whole or part if they wish.
 * Options from this 'blueprint.lifecycle.overrides' file are preferred over options set here, but the blueprint is free to write to this file.
 * New options will be respected on sobsequent synths
 *
 * There are several stages to lifecycle management.
 * 1. Get existing content
 * 2. Synthesize new content
 * 3. Resolve lifecycle options from LifeCycleControl
 * 4. Override lifecycle options with 'blueprint.lifecycle.overrides' in existing content (if it exists)
 * 5. Execute LifecycleControl options in priority order (e.g. run clean, run useExistingContent, run useNewContent, etc ...)
 * 6. Write content into the output directory.
 */
export interface LifecycleControl {
  /**
   * This is code that the blueprint customer is expected to own and make updates to. This is typically specific to the program the customer is building and not the type of codebase the customer is working in.
   * e.g. css files
   * This works by removing these file globs in new synthesis before starting any merge.
   */
  userOwned: string[];

  /**
   * This is code that the blueprint customer is expected to own and make updates to. This is typically specific to the program the customer is building and not the type of codebase the customer is working in.
   * e.g. css files
   * This works by removing these file globs in the existing codebase before starting any merge.
   */
  blueprintOwned: string[];

  /**
   * Some files might be shared. Specify how to resolve shared ownership
   */
  shared: MergeStrategy[];

  /**
   * This function will be invoked on all files that result in a merge but might otherwise not have been covered with ownership patterns.
   * @defaults defaultMergeStrategy
   */
  defaultMergeStrategy: MergeStrategyFunction;
}

export type MergeStrategyFunction = (filePath: string, existingContent: Buffer, newContent: Buffer, options?: {}) => string | NodeJS.ArrayBufferView;

export interface MergeStrategy {
  globs: string[];
  strategy: MergeStrategyFunction;
}

export interface MirroredFilePath {
  /**
   * This is a trimmed path to the file starting at the repository root.
   */
  path: string;

  /**
   * Absolute path to the existing file location
   */
  existingAbsPath: string | undefined;

  /**
   * Absolute path to the new file location
   */
  newAbsPath: string | undefined;
}
