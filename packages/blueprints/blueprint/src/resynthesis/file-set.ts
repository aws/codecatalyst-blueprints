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

/**
 * Create a set from the difference of filepath set A from filepath set B. Remaining filepaths will be unique to set B
 */
export function filepathDifferenceSet(fileLocation_A: string, fileLocation_B: string, resourcePaths: string[]): string[] {
  const filesetA = new Set<string>();
  const filesetB = new Set<string>();
  walkFiles(fileLocation_A, resourcePaths).forEach(filepath => {
    filesetA.add(filepath);
  });
  walkFiles(fileLocation_B, resourcePaths).forEach(filepath => {
    if (filesetA.has(filepath) == false) {
      filesetB.add(filepath);
    }
  });
  return Array.from(filesetB).sort();
}
