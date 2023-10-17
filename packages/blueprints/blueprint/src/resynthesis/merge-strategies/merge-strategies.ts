import { Diff3 } from './diff3';
import { ContextFile } from '../context-file';

export type StrategyFunction = (
  commonAncestorFile: ContextFile | undefined,
  existingFile: ContextFile | undefined,
  proposedFile: ContextFile | undefined,
  options?: {},
) => ContextFile | undefined;

export class MergeStrategies {
  /**
   * A strategy that always resolves to the proposed file.
   * @returns the proposed file.
   */
  public static alwaysUpdate: StrategyFunction = function alwaysUpdate(
    _commonAncestorFile: ContextFile | undefined,
    _existingFile: ContextFile | undefined,
    proposedFile: ContextFile | undefined,
    _options?: {},
  ) {
    return proposedFile;
  };

  /**
   * A strategy that always resolves to the existing file.
   * @returns the existing file.
   */
  public static neverUpdate: StrategyFunction = function neverUpdate(
    _commonAncestorFile: ContextFile | undefined,
    existingFile: ContextFile | undefined,
    _proposedFile: ContextFile | undefined,
    _options?: {},
  ) {
    return existingFile;
  };

  /**
   * A strategy that resolves to the proposed file when an existing file does not exist already.
   * Otherwise, resolves to the existing file.
   */
  public static onlyAdd: StrategyFunction = function onlyAdd(
    _commonAncestorFile: ContextFile | undefined,
    existingFile: ContextFile | undefined,
    proposedFile: ContextFile | undefined,
    _options?: {},
  ) {
    return existingFile ? existingFile : proposedFile;
  };

  /**
   * A strategy that performs a three way merge between the existing, proposed, and common
   * ancestor files. The resolved file may contain conflict markers if the files can not be
   * cleanly merged.
   *
   * The provided files' contents must be UTF-8 encoded in order for the strategy to produce
   * meaningful output. The strategy attempts to detect if the input files are binary. If
   * the strategy detects a merge conflict in a binary file, it always returns the
   * proposedFile.
   */
  public static threeWayMerge: StrategyFunction = function threeWayMerge(
    commonAncestorFile: ContextFile | undefined,
    existingFile: ContextFile | undefined,
    proposedFile: ContextFile | undefined,
  ) {
    // The three way merge algorithm below is text based and won't produce a meaningful result
    // when merging binary files. If there's a conflict in a binary file, default to returning
    // the proposedFile:
    if (isBinary(proposedFile?.buffer) || isBinary(existingFile?.buffer) || isBinary(commonAncestorFile?.buffer)) {
      if (buffersEqual(proposedFile?.buffer, commonAncestorFile?.buffer)) {
        // Handles the cases where all files are equal and where only the existing file differs:
        return existingFile;
      }

      return proposedFile;
    }

    if (!existingFile && proposedFile && commonAncestorFile && proposedFile.buffer.equals(commonAncestorFile.buffer)) {
      return undefined;
    }
    if (!proposedFile && existingFile && commonAncestorFile && existingFile.buffer.equals(commonAncestorFile.buffer)) {
      return undefined;
    }
    if (!existingFile && !proposedFile) {
      return undefined;
    }

    const diff3 = new Diff3(
      existingFile?.buffer.toString() ?? '',
      commonAncestorFile?.buffer.toString() ?? '',
      proposedFile?.buffer.toString() ?? '',
      {
        aLabel: 'existing',
        bLabel: 'proposed',
      },
    );

    const repositoryName = existingFile?.repositoryName ?? proposedFile?.repositoryName ?? commonAncestorFile?.repositoryName;
    if (!repositoryName) {
      throw new Error('Failed to determine repository name because no input files were provided.');
    }

    const path = existingFile?.path ?? proposedFile?.path ?? commonAncestorFile?.path;
    if (!path) {
      throw new Error('Failed to determine path because no input files were provided.');
    }

    return {
      repositoryName,
      path,
      buffer: Buffer.from(diff3.getMerged()),
    };
  };
}

const BINARY_FILE_HEURISTIC_MAX_LENGTH = 8000;

/**
 * Returns whether the given Buffer is binary or not using a heuristic based
 * approach of checking for null bytes in the beginning of the file contents.
 */
export function isBinary(fileBuffer?: Buffer): boolean {
  if (!fileBuffer) {
    return false;
  }

  const searchLength = Math.min(fileBuffer.length, BINARY_FILE_HEURISTIC_MAX_LENGTH);
  for (let i = 0; i < searchLength; i++) {
    if (fileBuffer[i] === 0) {
      return true;
    }
  }

  return false;
}

function buffersEqual(a: Buffer | undefined, b: Buffer | undefined) {
  if (!a && !b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  return a.equals(b);
}
