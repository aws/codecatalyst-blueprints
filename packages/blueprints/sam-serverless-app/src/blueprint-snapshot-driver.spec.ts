
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

describe('Blueprint snapshots for test configurations', () => {
  allTestConfigs().forEach(testConfig => {
    describe(`${testConfig.name} configuration`, () => {
      let blueprintOutdir;
      let configOutdir;

      beforeAll(() => {
        blueprintOutdir = prepareTempDir('blueprint');

        // Write options to a file, as that's what the Blueprints CLI consumes.
        const options: Options = {
          ...testConfig.config,
          outdir: blueprintOutdir,
        };
        configOutdir = prepareTempDir('config');
        const configOutfile = path.join(configOutdir, 'snap-config.json');
        fs.writeFileSync(configOutfile, JSON.stringify(options));
        console.debug(`Wrote snapshot config to ${configOutfile}`);

        // Synthesize using the Blueprint CLI
        const synthCmd = `npx blueprint synth ./ --outdirExact true --enableStableSynthesis false --outdir ${blueprintOutdir} --options ${configOutfile}`;
        console.debug(`Synthesis command: ${synthCmd}`);

        let synthBuffer;
        try {
          synthBuffer = cproc.execSync(synthCmd);
        } catch (e) {
          console.log(`Failed synthesis output:\n${synthBuffer}`);
          throw e;
        }
      });

      afterAll(() => {
        cleanUpTempDir(blueprintOutdir);
        cleanUpTempDir(configOutdir);
      });

      it('matches snapshots', async () => {
        for await (const snappedFile of getAllBlueprintSnapshottedFilenames(blueprintOutdir)) {
          await expect(fs.readFileSync(snappedFile.absPath, { encoding: 'utf-8' })).toMatchSnapshot(snappedFile.relPath);
        }
      });
    });
  });
});
