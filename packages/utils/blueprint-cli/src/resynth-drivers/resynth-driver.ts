import * as fs from 'fs';
import * as path from 'path';
import * as pino from 'pino';
import yargs from 'yargs';
import { EXISTING_BUNDLE_SUBPATH, resynthesize } from './resynth';
import { cleanUpDriver, getWizardOptions, makeDriverFile } from '../synth-drivers/synth-driver';

export interface ResynthDriverCliOptions extends yargs.Arguments {
  blueprint: string;
  outdir: string;
  defaultOptions: string;
  additionalOptions?: string;
  priorOptions?: string;
  existingBundle?: string;
  cache?: boolean;
  cleanUp: boolean;
}

/**
 * I call resynth on a blueprint
 * 1. I expect the blueprint to then figure out which type of synthesis i'm running
 *  a. normal quick synthesis
 *  b. cache synthesis
 *    c. build a cache
 * 2. figure out where my synthesis will end up going
 * 2. figure out the option(s) the blueprint will take
 * 3. run a resynthesis for each
 * @param log
 * @param options
 */
export async function driveResynthesis(log: pino.BaseLogger, options: ResynthDriverCliOptions): Promise<void> {
  // todo validate input

  // we want one driver file that we execute multiple times with different options
  const { synthDriver, resynthDriver } = await makeDriverFile(log, {
    blueprint: options.blueprint,
    cache: options.cache,
  });

  try {
    //figure out which options we have, call synthesis for each of these options
    const wizardConfigurations = getWizardOptions(log, {
      defaultOptionsLocation: options.defaultOptions,
      additionalOptionsLocation: options.additionalOptions,
    });

    for (const wizardOption of wizardConfigurations) {
      const jobname = `${'00.resynth.'}${path.parse(wizardOption.path).base}`;
      const outputDir = path.join(options.outdir, `${jobname}`);
      let priorOptions = getPriorOptions(log, [
        options.priorOptions,
        options.existingBundle && path.join(options.existingBundle, 'options.json'),
        path.join(outputDir, EXISTING_BUNDLE_SUBPATH, 'options.json'),
      ]);
      const existingBundle = options.existingBundle || path.join(outputDir, EXISTING_BUNDLE_SUBPATH);

      log.info('==========================================');
      log.info(`[${jobname}]`);
      log.info(
        [
          'npx blueprint resynth',
          `--options merge[${options.defaultOptions},${wizardOption.path}]`,
          `--blueprint ${options.blueprint}`,
          `--outdir ${outputDir}`,
          `--existing-bundle ${existingBundle}`,
          `--prior-blueprint ${options.blueprint}`,
          `--prior-options ${priorOptions?.path || `--options merge[${options.defaultOptions},${wizardOption.path}]`}`,
          `${(options.cache && '--cache') || ''}`,
        ].join(' '),
      );
      log.info('==========================================');
      void (await resynthesize(log, {
        synthDriver,
        resynthDriver,
        jobname,
        outdir: outputDir,
        blueprint: options.blueprint,
        options: wizardOption.option,
        priorBlueprint: options.blueprint,
        priorOptions: priorOptions?.option || wizardOption.option,
        existingBundleLocation: existingBundle,
        cleanUp: false,
      }));
    }
  } catch (error) {
    log.error(error as any);
  } finally {
    if (options.cleanUp === true) {
      cleanUpDriver(log, synthDriver);
      cleanUpDriver(log, resynthDriver);
    }
  }
}

/**
 * attempts to get options from each location in order (if they exist), otherwise returns undefined
 * If prioroptionsLocation is passed, but nothing is there, this errors.
 */
const getPriorOptions = (log: pino.BaseLogger, optionsLocation: (string | undefined)[]) => {
  const locations = optionsLocation.filter(elemnt => !!elemnt);
  for (const location of locations) {
    if (location && fs.existsSync(location)) {
      return {
        path: location,
        option: JSON.parse(fs.readFileSync(location).toString()),
      };
    }
  }
  const error = `could not file options at any of: ${JSON.stringify(locations)}`;
  log.warn(error);
  return undefined;
};
