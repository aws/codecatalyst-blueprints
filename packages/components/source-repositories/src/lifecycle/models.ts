/**
 * Lifecycle control over a repository allows a blueprint to reason about which files should and should not exist after a resynthesis.
 */
export interface Strategy {
  /**
   * unchanging identifier used to Id this merge strategy
   */
  identifier: string;

  /**
   * The owner of the strategy. Either a Blueprint package or the path to a local file.
   * @default - the Blueprint's package name
   */
  owner?: string;

  /**
   * human friendly description for this strategy
   */
  description?: string;

  /**
   * Merge strategy function
   */
  strategy: MergeStrategyFunction;

  /**
   * File globs subject to this strategy
   */
  globs: string[];
}

export interface File {
  repository: string;
  path: string;
  content: Buffer;
}
export type MergeStrategyFunction = (
  commonAncestorFile: File | undefined,
  existingFile: File | undefined,
  proposedFile: File | undefined,
  options?: {},
) => File | undefined;
