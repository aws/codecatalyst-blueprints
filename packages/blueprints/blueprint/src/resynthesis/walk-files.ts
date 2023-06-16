import * as fs from 'fs';
import path from 'path';
import * as globule from 'globule';

// globa patterns that represent all files.
export const ALL_FILES = ['**/*', '**/*.??*', '*'];
/**
 * Returns all the file paths under this locationPath that adhere to this glob patterns.
 */
export function walkFiles(locationPath: string, globPatterns: string[]): string[] {
  return globule
    .find(ALL_FILES, {
      cwd: locationPath,
      dot: true,
    })
    .filter(localPath => matchesGlob(localPath, globPatterns))
    .filter(localPath => !fs.lstatSync(path.join(locationPath, localPath)).isDirectory());
}

/**
 * check if a file path adheres to a glob pattern.
 */
export function matchesGlob(filePath: string, globPatterns: string[]): boolean {
  return globule.isMatch(globPatterns, filePath, {
    dot: true,
  });
}
