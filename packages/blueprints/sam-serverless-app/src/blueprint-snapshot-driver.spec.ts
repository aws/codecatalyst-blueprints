
import * as cproc from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { Options } from './blueprint';
import {
  allTestConfigs,
  cleanUpTempDir,
  getAllBlueprintSnapshottedFilenames,
  prepareTempDir,
} from './testSnapshotInfrastructure/infrastructure';

function beforeAllSync(testConfig) {
  const blueprintOutdir = prepareTempDir('blueprint');

  // Write options to a file, as that's what the Blueprints CLI consumes.
  const options: Options = {
    ...testConfig.config,
    outdir: blueprintOutdir,
  };
  const configOutdir = prepareTempDir('config');
  const configOutfile = path.join(configOutdir, 'snap-config.json');
  fs.writeFileSync(configOutfile, JSON.stringify(options));
  console.debug(`Wrote snapshot config to ${configOutfile}`);

  // Synthesize using the Blueprint CLI
  const synthCmd = `npx blueprint synth ./ --outdirExact true --enableStableSynthesis false --outdir ${blueprintOutdir} --defaults ${configOutfile}`;
  console.debug(`Synthesis command: ${synthCmd}`);

  let synthBuffer;
  try {
    synthBuffer = cproc.execSync(synthCmd);
  } catch (e) {
    console.log(`Failed synthesis output:\n${synthBuffer}`);
    throw e;
  }

  return [blueprintOutdir, configOutdir];
}

describe('Blueprint snapshots', () => {
  allTestConfigs().forEach(testConfig => {
    describe(`${testConfig.name} configuration`, () => {
      /**
       * This is structured somewhat uniquely because we want a separate Jest test for each
       * snapshotted file to make the output more detailed and failures clearer to diagnose.
       *
       * Jest requires tests to be defined synchronously (https://github.com/facebook/jest/issues/2235),
       * so we need to synthesize the blueprint synchronously. Both *beforeAll* and *beforeEach*
       * run asynchronously, so we run our own sync code to set up blueprints.
      */
      const [blueprintOutdir, configOutdir] = beforeAllSync(testConfig);

      afterAll(() => {
        cleanUpTempDir(blueprintOutdir);
        cleanUpTempDir(configOutdir);
      });

      for (const snappedFile of getAllBlueprintSnapshottedFilenames(blueprintOutdir)) {
        it(`matches ${snappedFile.relPath}`, () => {
          expect(fs.readFileSync(snappedFile.absPath, { encoding: 'utf-8' })).toMatchSnapshot();
        });
      }
    });
  });
});
