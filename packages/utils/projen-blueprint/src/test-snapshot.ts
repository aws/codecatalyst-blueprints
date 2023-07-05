import * as fs from 'fs';
import * as path from 'path';
import { JsonFile, Project, SourceCode } from 'projen';
import { BlueprintSnapshotConfiguration } from './blueprint';
import { generateSpecTs } from './snapshot-testing/gen-spec';

export const SRC_DIR = 'src';
export const CONFIGS_SUBDIR = 'wizard-configurations';
export const DEFAULT_TEST_CONFIG_FILENAME = 'defaults.json';
export const SNAPSHOTS_SPEC_FILENAME = 'blueprint-snapshot-driver.spec.ts';

export function generateTestSnapshotInfraFiles(project: Project, testingConfig: BlueprintSnapshotConfiguration) {
  // If you add or change any files here, remember to update `cleanUpTestSnapshotInfraFiles()`
  const files = [
    [
      generateSpecTs({
        configuration: testingConfig,
        snapshotConfigsLocation: path.join(SRC_DIR, CONFIGS_SUBDIR),
        defaultsLocation: path.join(SRC_DIR, DEFAULT_TEST_CONFIG_FILENAME),
      }),
      path.join(SRC_DIR, SNAPSHOTS_SPEC_FILENAME),
    ],
  ];

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
