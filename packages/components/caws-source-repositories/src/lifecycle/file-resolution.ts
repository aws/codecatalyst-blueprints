import * as fs from 'fs';
import path from 'path';
import { MirroredFilePath } from './models';

/**
 * Returns all the file paths under this locationPath that adhere to this glob pattern.
 */
export function* walkFiles(locationPath: string, glob: string): IterableIterator<string> {
  yield locationPath;
  for (const subnode of []) {
    yield* walkFiles(subnode, glob);
  }
}

/**
 * check if a file paths adheres to a glob pattern.
 */
export function isInGlob(_locationPath: string, _glob: string): boolean {
  return false;
}

export function removeFiles(
  pathLocation: string,
  globs: string[],
  options: {
    operation: string;
  },
) {
  globs.forEach(glob => {
    for (const file of walkFiles(pathLocation, glob)) {
      console.log(`${options.operation}: ${file.replace(pathLocation, '')}`);
      fs.rmSync(file, { force: true });
    }
  });
}

export function makeMirroredPaths(existingRoot: string, newRoot: string, filePath: string): MirroredFilePath {
  let trimmedPath = filePath.replace(existingRoot, '');
  trimmedPath = trimmedPath.replace(newRoot, '');

  const existingCodePath = path.join(existingRoot, trimmedPath);
  const newCodePath = path.join(newRoot, trimmedPath);
  return {
    path: trimmedPath,
    existingAbsPath: fileExists(existingCodePath) ? existingCodePath : undefined,
    newAbsPath: fileExists(newCodePath) ? newCodePath : undefined,
  };
}

/**
 * Implements a visitor pattern to walk all the filePaths at a directory location depth first that adhere to a particlar glob.
 */
export function fileExists(location: string): boolean {
  return fs.existsSync(location);
}
