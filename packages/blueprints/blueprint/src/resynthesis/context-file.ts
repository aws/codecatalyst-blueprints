import * as fs from 'fs';
import * as path from 'path';

export interface ContextFile {
  repositoryName: string;
  path: string;
  buffer: Buffer;
}

/**
 *
 * @param bundleLocation Path to the bundle location where all the repositories are stored
 * @param prefix bundle resource path e.g. 'src'
 * @param filepath Path to the file within the bundle
 * @returns ContextFile | undefined
 */
export function createContextFile(bundleLocation: string, filepath: string): ContextFile | undefined {
  const absoluteLocation = path.join(bundleLocation, filepath);
  if (!fs.existsSync(absoluteLocation) || !fs.lstatSync(absoluteLocation).isFile()) {
    // file doesn't exist, or isnt a file
    return undefined;
  }
  const chunks = filepath.split('/');
  const [repositoryName, repofilepath] = [chunks.shift(), path.join(...chunks)];
  if (fs.lstatSync(path.join(bundleLocation, repositoryName || '')).isDirectory()) {
    // only consider folders as repos
    return {
      repositoryName: repositoryName!,
      path: repofilepath,
      buffer: fs.readFileSync(absoluteLocation),
    };
  }
  return undefined;
}
