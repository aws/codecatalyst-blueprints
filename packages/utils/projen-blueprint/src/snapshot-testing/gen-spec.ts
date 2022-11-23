export function generateSpecTs(infraSubdir: string): string {
  return `
import * as fs from 'fs';

import { Blueprint, Options } from './blueprint';
import {
  allTestConfigs,
  cleanUpOutdir,
  getAllBlueprintSnapshottedFilenames,
  prepareNewOutdir
} from './${infraSubdir}/infrastructure';

describe('Blueprint snapshots for test configurations', () => {
  allTestConfigs().forEach(testConfig => {
    describe(\`\${testConfig.name} configuration\`, () => {
      let blueprint;

      beforeAll(() => {
        const outdir = prepareNewOutdir();
        const options: Options = {
          ...testConfig.config,
          outdir,
        };
        blueprint = new Blueprint(options);
        blueprint.synth();
      });

      afterAll(() => {
        cleanUpOutdir(blueprint.outdir);
      });

      it('matches snapshots', async () => {
        for await (const snappedFile of getAllBlueprintSnapshottedFilenames(blueprint.outdir)) {
          await expect(fs.readFileSync(snappedFile.absPath, { encoding: 'utf-8' })).toMatchSnapshot(snappedFile.relPath);
        }
      });
    });
  });
});
`;
}
