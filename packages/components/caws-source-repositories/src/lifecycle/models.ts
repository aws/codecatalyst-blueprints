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
   * These are file globs that the blueprint will clean from the existing content prior to writing anything as part of resynthesis.
   * This results in these file globs always being hard replaced.
   * The blueprint will remove everything in these globs and before doing any writing.
   * @priority 1
   */
  alwaysReplace: string[];

  /**
   * These are file globs that the blueprint will never add into as part of resynthesis.
   * The blueprint will never write into these globs as part of resynthesis.
   * @priority 2
   */
  neverReplace: string[];

  /**
   * These are file globs that will use existing content when merging files.
   * It will always use existing content. This is the opposite of 'useNewContent' strategy.
   * @priority 3
   */
  mergeUsingExistingContent: string[];

  /**
   * These are file globs that will use new, incoming content when merging files
   * It will always overwrite existing content with new content. This is the opposite of 'useExistingContent' strategy.
   * @priority 4
   */
  mergeUsingNewContent: string[];

  /**
   * Implement this method if you want your own merge strategy on files that conflict.
   * @defaults defaultMergeStrategy
   */
  mergeStrategy: MergeStrategyFunction;
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
