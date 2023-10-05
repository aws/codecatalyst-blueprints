import { BlueprintSnapshotConfiguration } from '../blueprint';

const DEFAULT_GLOBS = ['**'];

export function generateSpecTs(options: {
  configuration: BlueprintSnapshotConfiguration;
  snapshotConfigsLocation: string;
  defaultsLocation: string;
}): string {
  return `import * as fs from 'fs';
import * as path from 'path';
import * as cli from '@amazon-codecatalyst/blueprint-util.cli/lib/synth-drivers/synth-driver';
import { PROPOSED_BUNDLE_SUBPATH } from '@amazon-codecatalyst/blueprint-util.cli/lib/resynth-drivers/resynth';
import * as globule from 'globule';
import * as pino from 'pino';

const log = pino.default({
  prettyPrint: true,
  level: process.env.LOG_LEVEL || 'debug',
});

const configurationsLocation = '${options.snapshotConfigsLocation}';
const defaultsLocation = '${options.defaultsLocation}';
const blueprintLocation = './';
const outputDirectory = './';

// prettier-ignore
const GLOBS_UNDER_SNAPSHOT: string[] = [
  ${(options.configuration.snapshotGlobs ?? DEFAULT_GLOBS).map(val => `'${val}'`).join(',\n\t')}
];

async function runSnapshotSynthesis() {
  // run synthesis into several directories.

  await cli.driveSynthesis(log, {
    blueprint: blueprintLocation,
    outdir: path.join(outputDirectory, 'synth'),
    defaultOptions: defaultsLocation,
    additionalOptions: configurationsLocation,
    jobPrefix: '01.snapshot.',
    cleanUp: true,
  } as cli.SynthDriverCliOptions);

  const snapshotRuns: {
    optionOverridePath: string;
    outputPath: string;
  }[] = [];
  fs.readdirSync(configurationsLocation, { withFileTypes: true }).forEach(override => {
    const outputLocation = path.join(outputDirectory, 'synth', '01.snapshot.' + override.name, PROPOSED_BUNDLE_SUBPATH);
    snapshotRuns.push({
      optionOverridePath: path.join(configurationsLocation!, override.name),
      outputPath: path.resolve(outputLocation),
    });
  });
  return snapshotRuns;
}

describe('Blueprint snapshots', () => {
  it('Blueprint snapshots - Test', async () => {
    (await runSnapshotSynthesis()).forEach(run => {
      for (const snappedFile of filesUnderSnapshot(run.outputPath, GLOBS_UNDER_SNAPSHOT)) {
        console.log(\`\${path.parse(run.optionOverridePath).base} configuration - matches \${snappedFile.relPath}\`);
        expect(fs.readFileSync(snappedFile.absPath, { encoding: 'utf-8' })).toMatchSnapshot();
      }
    });
  });
});

/**
 * In unit tests, we need both the absolute and the relative paths.
 * The absolute path helps us to access the files on the filesystem. It varies for each test run.
 * The relative path is used to reference a file's snapshot across test runs. It is constant.
 */
interface BlueprintOutputFile {
  absPath: string;
  relPath: string;
}

function filesUnderSnapshot(outdir: string, globs: string[]): BlueprintOutputFile[] {
  return globule
    .find(['**/*', '**/*.??*', '*'], {
      cwd: outdir,
      dot: true,
    })
    .filter(element =>
      globule.isMatch(globs, element, {
        dot: true,
      }),
    )
    .filter(element => !fs.lstatSync(path.join(outdir, element)).isDirectory())
    .map(element => {
      return {
        absPath: path.join(outdir, element),
        relPath: element,
      };
    });
}
`;
}
