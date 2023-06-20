import * as fs from 'fs';
import path from 'path';
import { ContextFile } from './merge-strategies/models';
import { ALL_FILES, walkFiles } from './walk-files';

/**
 *
 * @param bundleLocation Path to the bundle location where all the repositories are stored
 * @param prefix Path prefix, e.g. 'src'
 * @param filepath Path to the file within the bundle
 * @returns ContextFile | undefined
 */
export function createContextFile(bundleLocation: string, prefix: string, filepath: string): ContextFile | undefined {
  const absoluteLocation = path.join(bundleLocation, prefix, filepath);
  if (!fs.existsSync(absoluteLocation)) {
    // file doesn't exist
    return undefined;
  }
}

/**
 *
 * @param
 * @returns
 */
export function filepathSet(fileLocations: string[]): string[] {
  const fileset = new Set<string>();
  fileLocations.forEach(location => {
    walkFiles(location, ALL_FILES).forEach(filepath => {
      fileset.add(filepath);
    });
  });
  return Array.from(fileset).sort();
}
