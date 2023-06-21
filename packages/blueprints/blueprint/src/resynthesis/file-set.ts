import * as fs from 'fs';
import path from 'path';
import { ContextFile } from './merge-strategies/models';
import { ALL_FILES, walkFiles } from './walk-files';

/**
 *
 * @param bundleLocation Path to the bundle location where all the repositories are stored
 * @param prefix bundle resource path e.g. 'src'
 * @param filepath Path to the file within the bundle
 * @returns ContextFile | undefined
 */
export function createContextFile(bundleLocation: string, filepath: string): ContextFile | undefined {
  const absoluteLocation = path.join(bundleLocation, filepath);
  if (!fs.existsSync(absoluteLocation)) {
    // file doesn't exist
    return undefined;
  }
  const chunks = filepath.split('/');
  const pathing = [chunks.shift(), path.join(...chunks)];
  return {
    repositoryName: pathing[0] || '',
    path: pathing[1] || '',
    buffer: fs.readFileSync(absoluteLocation),
  };
}

/**
 *
 * @param
 * @returns
 */
export function filepathSet(fileLocations: string[], resourcePaths?: string[]): string[] {
  const fileset = new Set<string>();
  fileLocations.forEach(location => {
    walkFiles(location, resourcePaths || ALL_FILES).forEach(filepath => {
      fileset.add(filepath);
    });
  });
  return Array.from(fileset).sort();
}
