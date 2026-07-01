import { execFileSync } from 'child_process';
import { randomBytes } from 'crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import * as path from 'path';
import { CONFLICT_MARKER_LENGTH } from './diff3';
import { StrategyFunction } from './merge-strategies';
import { ContextFile } from '../context-file';

export function constructLocalStrategy(owner: string, ownershipPath: string): StrategyFunction {
  return (
    commonAncestorFile: ContextFile | undefined,
    existingFile: ContextFile | undefined,
    proposedFile: ContextFile | undefined,
  ): ContextFile | undefined => {
    const repositoryName = existingFile?.repositoryName ?? proposedFile?.repositoryName ?? commonAncestorFile?.repositoryName;
    if (!repositoryName) {
      throw new Error('Failed to determine repository name because no input files were provided.');
    }

    const resolvedPath = existingFile?.path ?? proposedFile?.path ?? commonAncestorFile?.path;
    if (!resolvedPath) {
      throw new Error('Failed to determine path because no input files were provided.');
    }

    const resolvedBuffer = runLocalCommand(owner, ownershipPath, resolvedPath, {
      a: existingFile?.buffer ?? Buffer.from(''),
      o: commonAncestorFile?.buffer ?? Buffer.from(''),
      b: proposedFile?.buffer ?? Buffer.from(''),
    });
    if (!resolvedBuffer) {
      return undefined;
    }

    return {
      repositoryName,
      path: resolvedPath,
      buffer: resolvedBuffer,
    };
  };
}

function runLocalCommand(
  owner: string,
  ownershipPath: string,
  resolvedPath: string,
  buffers: { a: Buffer; o: Buffer; b: Buffer },
): Buffer | undefined {
  createTempDir();

  let cmdArgs: string[] | undefined;
  try {
    const commonTempFile = createTempFile(buffers.o);
    const existingTempFile = createTempFile(buffers.a);
    const proposedTempFile = createTempFile(buffers.b);

    const cwd = path.dirname(ownershipPath);
    cmdArgs = formatLocalCommandArgs(
      owner,
      path.relative(cwd, existingTempFile),
      path.relative(cwd, commonTempFile),
      path.relative(cwd, proposedTempFile),
      resolvedPath,
    );

    const [executable, ...args] = cmdArgs;
    execFileSync(executable, args, {
      cwd,
    });

    // git merge driver conventions expect the resolved file to have been written to the existing file's path:
    return getResolvedFile(existingTempFile);
  } catch (error: unknown) {
    let message = 'Failed to run local merge strategy';
    if (cmdArgs) {
      message += `: ${cmdArgs.join(' ')}`;
    }

    throw new Error(`${message}: ${error}`);
  } finally {
    deleteTempDir();
  }
}

function getResolvedFile(resolvedPath: string): Buffer | undefined {
  try {
    return readFileSync(resolvedPath);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return undefined;
    }

    throw error;
  }
}

function createTempDir() {
  try {
    mkdirSync(path.join('synth', 'tmp'), { recursive: true });
  } catch (error: any) {
    if (error.code === 'EEXIST') {
      return;
    }

    throw error;
  }
}

function deleteTempDir() {
  rmSync(path.join('synth', 'tmp'), { recursive: true });
}

function createTempFile(contents: Buffer): string {
  const randomSuffix = randomBytes(8).toString('hex');
  const tempPath = path.join('synth', 'tmp', `.merge_file_${randomSuffix}`);
  writeFileSync(tempPath, contents, {
    flag: 'wx',
  });

  return tempPath;
}

function formatLocalCommandArgs(commandPattern: string, aPath: string, oPath: string, bPath: string, resolvedPath: string): string[] {
  // see: https://git-scm.com/docs/gitattributes#_defining_a_custom_merge_driver
  const substituted = commandPattern
    .replace(/%O/g, oPath)
    .replace(/%A/g, aPath)
    .replace(/%B/g, bPath)
    .replace(/%P/g, resolvedPath)
    .replace(/%L/g, `${CONFLICT_MARKER_LENGTH}`);
  return substituted.split(/\s+/).filter(s => s.length > 0);
}
