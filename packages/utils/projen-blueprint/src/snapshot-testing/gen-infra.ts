import { BlueprintSnapshotConfiguration } from '../blueprint';

const DEFAULT_GLOBS = ['**'];

export function generateSnapshotInfraFile(testingConfig: BlueprintSnapshotConfiguration, srcDir: string, configsSubdir: string): string {
  return `
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as globule from 'globule';
import * as path from 'path';
import merge from 'ts-deepmerge';

import { Options } from '../blueprint';

const PATH_TO_SRC = '${srcDir}';
const PATH_TO_CONFIGS = path.join(PATH_TO_SRC, '${configsSubdir}');
// eslint-disable-next-line
const GLOBS: string[] = ${JSON.stringify(testingConfig.snapshotGlobs ?? DEFAULT_GLOBS)};

type TestConfigFromFile = Omit<Options, 'outdir'>;

export function getFilenamesInPath(p: fs.PathLike): fs.PathLike[] {
  if (!fs.existsSync(p)) {
    return [];
  }

  const dirFilenames: string[] = [];
  const dir = fs.opendirSync(p);
  let entry;

  while ((entry = dir.readSync()) != null) {
    if (entry.isFile()) {
      dirFilenames.push(entry.name);
    }
  }

  return dirFilenames;
}

/**
 * In unit tests, we need both the absolute and the relative paths.
 * The absolute path helps us to access the files on the filesystem. It varies for each test run.
 * The relative path is used to reference a file's snapshot across test runs. It is constant.
 */
interface BlueprintOutputFile {
  absPath: string;
  relPath: string;
}

async function* getAllNestedFiles(absOriginalRootPath: string, absCurrentRootPath: string): AsyncGenerator<BlueprintOutputFile> {
  for (const entry of await fsPromises.readdir(absCurrentRootPath)) {
    const entryWithAbsPath = path.resolve(absCurrentRootPath, entry);
    if ((await fsPromises.stat(entryWithAbsPath)).isDirectory()) {
      yield* getAllNestedFiles(absOriginalRootPath, entryWithAbsPath);
    } else {
      const relPathToEntry = path.relative(absOriginalRootPath, absCurrentRootPath);
      const entryWithRelPath = path.join(relPathToEntry, entry);
      const isIncluded = globule.isMatch(GLOBS, entryWithRelPath, { matchBase: true });
      if (isIncluded) {
        yield {
          absPath: entryWithAbsPath,
          relPath: entryWithRelPath,
        };
      }
      else {
        console.debug(\`Skipping snapshot testing for <\${entryWithRelPath}> per .projenrc\`);
      }
    }
  }
}

export function getAllBlueprintSnapshottedFilenames(outdir: string) {
  return getAllNestedFiles(outdir, outdir);
}

// We'll incorporate the given hint into the filename, to help disambiguate
// if the consumer wants multiple directories.
export function prepareTempDir(hint: string): string {
  const outdir = fs.mkdtempSync(\`outdir-test-\${hint}\`);
  console.debug(\`outdir: \${outdir}\`);

  // Clean up the directory. If we don't clean up, then \`mkdirSync\` will throw an error.
  fs.rmSync(outdir, { force: true, recursive: true });

  fs.mkdirSync(outdir);

  return outdir;
}

export function cleanUpTempDir(outdir: string): void {
  console.debug(\`cleaning up outdir: \${outdir}\`);
  fs.rmSync(outdir, { force: true, recursive: true });
}

export function listTestConfigNames(): string[] {
  return (
    getFilenamesInPath(PATH_TO_CONFIGS)
      // chop off ".json"
      .map(p => p.toString().slice(0, -'.json'.length))
  );
}

export function getTestConfig(name: string): TestConfigFromFile {
  const defaultsConfig = JSON.parse(fs.readFileSync(path.join(PATH_TO_SRC, 'defaults.json')).toString());
  const testConfig = JSON.parse(fs.readFileSync(path.join(PATH_TO_CONFIGS, \`\${name}.json\`)).toString());
  return merge(defaultsConfig, testConfig) as unknown as TestConfigFromFile;
}

export interface TestConfig {
  name: string;
  config: TestConfigFromFile;
}

export function allTestConfigs(): TestConfig[] {
  return listTestConfigNames().map(configName => ({
    name: configName,
    config: getTestConfig(configName),
  }));
}
  `;
}
