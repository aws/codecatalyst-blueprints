import * as fs from 'fs';
import path from 'path';
import * as globule from 'globule';
import * as ini from 'ini';
import { File } from '../files/file';
import { SourceRepository } from '../repository';

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

export function cleanExistingCodeAndNewSynth(
  repository: SourceRepository,
  options: {
    blueprintOwned: string[];
    userOwned: string[];
    existingCodeLocation: string;
  },
) {
  const { blueprintOwned, userOwned, existingCodeLocation } = options;

  // replace all the existing user owned files from the old synth into the new synth
  for (const filepath of Object.keys(repository.getFiles())) {
    if (matchesGlob(filepath, userOwned)) {
      console.log(`Enforcing User Owns: ${filepath} becuase ${userOwned}`);
      new File(repository, filepath, fs.readFileSync(path.join(existingCodeLocation, filepath)));
    }
  }

  // remove all the blueprint owned files from the existing codebase,
  // remove all the user owned files from the new synth
  for (const file of walkFiles(existingCodeLocation, blueprintOwned)) {
    if (matchesGlob(file, userOwned)) {
      console.log(`Blueprint and User Owns: ${file}`);
      console.log(`User Ownership wins: ${file} becuase user owns ${userOwned} and blueprint owns ${blueprintOwned}`);
    } else {
      console.log(`Enforcing Blueprint Owns: ${file} becuase ${blueprintOwned}`);
      fs.rmSync(file, { force: true });
    }
  }
}

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
  const fileContents = fs.readFileSync(filePath, 'utf8');

  // Parse the INI file using the ini module
  const iniObject = ini.parse(fileContents);

  // Convert the object to the desired format
  const result: IniObject = {};
  for (const [key, value] of Object.entries(iniObject)) {
    result[key] = `${value}`.split('\n');
  }
  return result;
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
