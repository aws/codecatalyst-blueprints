import { ALL_FILES, walkFiles } from './walk-files';

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
