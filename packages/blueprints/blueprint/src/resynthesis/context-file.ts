import * as fs from 'fs';
import * as path from 'path';

export interface ContextFile {
  repositoryName: string;
  path: string;
  buffer: Buffer;
}

export interface DestructuredPath {
  absolutePath: string;
  absoluteBundlePath: string;
  resourcePrefix?: string;
  /**
   * first folder under the resource prefix
   */
  subdirectory?: string;
  /**
   * relative to the subdirectory
   */
  filepath?: string;
}

export function destructurePath(absoluteFilePath: string, absoluteBundlePath: string): DestructuredPath {
  const relativePath = path.relative(absoluteBundlePath, absoluteFilePath);
  const splitpath = path.posix.normalize(relativePath).split('/');

  let resourcePrefix = splitpath.shift();
  if (!resourcePrefix) {
    return {
      absolutePath: absoluteFilePath,
      absoluteBundlePath: absoluteBundlePath,
      filepath: path.join(...splitpath),
    };
  }

  let subdirectory = splitpath.shift();
  if (!subdirectory) {
    return {
      absolutePath: absoluteFilePath,
      absoluteBundlePath: absoluteBundlePath,
      resourcePrefix,
      filepath: path.join(...splitpath),
    };
  }

  return {
    absolutePath: absoluteFilePath,
    absoluteBundlePath: absoluteBundlePath,
    resourcePrefix,
    subdirectory,
    filepath: path.join(...splitpath),
  };
}

/**
 *
 * @param bundleLocation Path to the bundle location root
 * @param resourcePrefix bundle resource path e.g. 'src'
 * @param repositoryName name of the repo
 * @param filepath Path to the file within the repository
 * @returns ContextFile | undefined
 */
export function createContextFile(bundlepath: string, resourcePrefix: string, repositoryName: string, filepath: string): ContextFile | undefined {
  const absoluteRepoLocation = path.join(bundlepath, resourcePrefix, repositoryName);
  const absoluteFileLocation = path.join(absoluteRepoLocation, filepath);

  if (fs.existsSync(absoluteFileLocation) && fs.lstatSync(absoluteRepoLocation).isDirectory() && fs.lstatSync(absoluteFileLocation).isFile()) {
    return {
      repositoryName: repositoryName,
      path: filepath,
      buffer: fs.readFileSync(absoluteFileLocation),
    };
  }
  return undefined;
}
