import * as fs from 'fs';
import path from 'path';
import * as glob from 'glob';
import { minimatch } from 'minimatch';

// globa patterns that represent all files.
export const ALL_FILES = ['**/*', '**/*.??*', '*'];
/**
 * Returns all the file paths under this locationPath that adhere to this glob patterns.
 */
export function walkFiles(locationPath: string, globPatterns: string[]): string[] {
  return glob
    .sync(ALL_FILES, {
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
  for (const pattern of globPatterns) {
    if (minimatch(filePath, pattern)) {
      return true;
    }
  }
  return false;
}

export const removeFolders = (folders: string[]) => {
  folders.forEach(folder => {
    if (fs.existsSync(folder)) {
      fs.rmSync(folder, {
        recursive: true,
        force: true,
      });
    }
  });
};
