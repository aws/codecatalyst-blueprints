import * as fs from 'fs';
import * as path from 'path';
import { JsonFile, Project, SourceCode } from 'projen';
import { BlueprintSnapshotConfiguration } from './blueprint';
import { generateSnapshotInfraFile } from './snapshot-testing/gen-infra';
import { generateSpecTs } from './snapshot-testing/gen-spec';

const SRC_DIR = 'src';
const INFRA_SUBDIR = 'testSnapshotInfrastructure';
const CONFIGS_SUBDIR = 'snapshot-configurations';
const DEFAULT_TEST_CONFIG_FILENAME = 'default-config.json';
const SNAPSHOTS_SPEC_FILENAME = 'blueprint-snapshot-driver.spec.ts';

export function generateTestSnapshotInfraFiles(project: Project, testingConfig: BlueprintSnapshotConfiguration) {
  // If you add or change any files here, remember to update `cleanUpTestSnapshotInfraFiles()`
  const files = [
    [generateSnapshotInfraFile(testingConfig, SRC_DIR, CONFIGS_SUBDIR),
      path.join(SRC_DIR, INFRA_SUBDIR, 'infrastructure.ts')],
    [generateSpecTs(INFRA_SUBDIR),
      path.join(SRC_DIR, SNAPSHOTS_SPEC_FILENAME)],
  ];

  const infraDir = path.join(SRC_DIR, INFRA_SUBDIR);
  // Clean up the directory. If we don't clean up, then `mkdirSync` will throw an error.
  fs.rmSync(infraDir, { recursive: true, force: true });
  fs.mkdirSync(infraDir);

  files.forEach(([fileContent, fileName]) => {
    const sourceCodeObj = new SourceCode(project, fileName);
    fileContent.split('\n').forEach(line => sourceCodeObj.line(line));
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
  fs.rmSync(path.join(SRC_DIR, SNAPSHOTS_SPEC_FILENAME), { force: true });
}
