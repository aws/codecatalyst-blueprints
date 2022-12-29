import * as fs from 'fs';
import path from 'path';
import * as glob from 'glob';
import * as minimatch from 'minimatch';
import { MirroredFilePath } from './models';

/**
 * Returns all the file paths under this locationPath that adhere to this glob pattern.
 */
export function* walkFiles(locationPath: string, globPattern: string): IterableIterator<string> {
  const filePaths = glob.sync(path.join(locationPath, globPattern));
  for (const filePath of filePaths) {
    yield filePath;
  }

  const subdirectories = fs.readdirSync(locationPath).filter(item => fs.statSync(path.join(locationPath, item)).isDirectory());
  for (const subdirectory of subdirectories) {
    yield* walkFiles(path.join(locationPath, subdirectory), globPattern);
  }
}

/**
 * check if a file path adheres to a glob pattern.
 */
export function matchesGlob(filePath: string, globPattern: string): boolean {
  return minimatch.default(filePath, globPattern);
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


import * as fs from "fs";
import * as ini from "ini";

interface IniObject {
  [key: string]: string[];
}

/**
 * Read an INI file and return its contents as an object mapping keys to arrays of strings.
 *
 * @param filePath The path to the INI file.
 * @returns The contents of the INI file as an object.
 * @throws An error if the file cannot be read or is not a valid INI file.
 */
export function readIniFile(filePath: string): IniObject {
  // Read the file contents
  const fileContents = fs.readFileSync(filePath, "utf8");

  // Parse the INI file using the ini module
  const iniObject = ini.parse(fileContents);

  // Convert the object to the desired format
  const result: IniObject = {};
  for (const [key, value] of Object.entries(iniObject)) {
    result[key] = `${value}`.split("\n");
  }
  return result;
}
