import * as fs from 'fs';
import * as path from 'path';
import { JsonFile, Project, TextFile } from 'projen';
import { BlueprintSnapshotConfiguration } from './blueprint';
import { generateFilesTs } from './snapshot-testing/gen-files';
import { generateOutdirTs } from './snapshot-testing/gen-outdir';
import { generateSpecTs } from './snapshot-testing/gen-spec';
import { generateTestConfigsTs } from './snapshot-testing/gen-test-configs';

const DEFAULT_GLOBS = [
  '**',
  '!environments/**',
  '!aws-account-to-environment/**',
];

const SRC_DIR = 'src';
const INFRA_SUBDIR = 'testSnapshotInfra';
const CONFIGS_SUBDIR = 'test-configs';
const DEFAULT_TEST_CONFIG_FILENAME = 'default-config.json';

export function generateTestSnapshotInfraFiles(project: Project, testingConfig: BlueprintSnapshotConfiguration) {
  // If you add or change any files here, remember to update `cleanUpTestSnapshotInfraFiles()`
  const files = [
    [generateFilesTs(testingConfig.snapshotGlobs ?? DEFAULT_GLOBS),
      path.join(SRC_DIR, INFRA_SUBDIR, 'files.ts')],
    [generateOutdirTs(),
      path.join(SRC_DIR, INFRA_SUBDIR, 'outdir.ts')],
    [generateTestConfigsTs(),
      path.join(SRC_DIR, INFRA_SUBDIR, 'testConfigs.ts')],
    [generateSpecTs(INFRA_SUBDIR),
      path.join(SRC_DIR, 'blueprint-snapshots.spec.ts')],
  ];

  const infraDir = path.join(SRC_DIR, INFRA_SUBDIR);
  // Clean up the directory. If we don't clean up, then `mkdirSync` will throw an error.
  fs.rmSync(infraDir, { recursive: true, force: true });
  fs.mkdirSync(infraDir);

  files.forEach(([fileContent, fileName]) => {
    // These are source code files, but we use `TextFile` instead of `SourceCode` because
    // the former lets us choose to not commit these.
    const fileObj = new TextFile(project, fileName, {
      committed: false,
      marker: false, // we add our own marker
    });
    fileContent.split('\n').forEach(line => fileObj.addLine(line));
  });

  const configsDir = path.join(SRC_DIR, CONFIGS_SUBDIR);
  if (!fs.existsSync(configsDir)) {
    fs.mkdirSync(configsDir);
    const defaultTestConfigFile = path.join(configsDir, DEFAULT_TEST_CONFIG_FILENAME);
    new JsonFile(project, defaultTestConfigFile, {
      marker: false, // don't write the warning to not edit this file, because we do want customers to edit it
      obj: {},
      readonly: false,
    });
  } // else the customer already has a configs directory, so we don't want to change anything there.
}

export function cleanUpTestSnapshotInfraFiles() {
  const dir = path.join(SRC_DIR, INFRA_SUBDIR);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.rmSync(path.join(SRC_DIR, 'blueprint-snapshots.spec.ts'), { force: true });
}
