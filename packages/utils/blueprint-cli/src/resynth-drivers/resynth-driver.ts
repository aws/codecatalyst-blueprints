import * as fs from 'fs';
import * as path from 'path';
import * as pino from 'pino';
import yargs from 'yargs';
import { cleanUpDriver, getWizardOptions, makeDriverFile } from '../synth-drivers/synth-driver';
import { EXISTING_BUNDLE_SUBPATH, resynthesize } from './resynth';

export interface ResynthDriverCliOptions extends yargs.Arguments {
  blueprint: string;
  outdir: string;
  defaultOptions: string;
  additionalOptions?: string;
  existingBundle?: string;
  cache?: boolean;
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
  const { synthDriver, resynthDriver } = makeDriverFile(log, {
    blueprint: options.blueprint,
    cache: options.cache,
  });

  try {
    //figure out which options we have, call synthesis for each of these options
    const wizardConfigurations = getWizardOptions(log, {
      defaultOptionsLocation: options.defaultOptions,
      additionalOptionsLocation: options.additionalOptions,
    });

    wizardConfigurations.forEach(wizardOption => {
      const jobname = `${'00.resynth.'}${path.parse(wizardOption.path).base}`;
      const outputDir = path.join(options.outdir, `${jobname}`);
      const priorOptionsLocation = path.join(options.existingBundle || options.outdir, EXISTING_BUNDLE_SUBPATH, 'options.json');

      log.info('==========================================');
      log.info(`[${jobname}]`);
      log.info(
        [
          'npx blueprint resynth',
          `--options merge[${options.defaultOptions},${wizardOption.path}]`,
          `--blueprint ${options.blueprint}`,
          `--outdir ${outputDir}`,
          `${(options.cache && '--cache') || ''}`,
        ].join(' '),
      );
      log.info('==========================================');
      resynthesize(log, {
        synthDriver,
        resynthDriver,
        jobname,
        outdir: outputDir,
        blueprint: options.blueprint,
        options: wizardOption.option,
        priorBlueprint: options.blueprint,
        priorOptions: getOptions(log, priorOptionsLocation),
        existingBundleLocation: options.existingBundle || path.join(options.outdir, EXISTING_BUNDLE_SUBPATH),
      });
    });
  } catch (error) {
    log.error(error as any);
  } finally {
    cleanUpDriver(log, synthDriver);
    cleanUpDriver(log, resynthDriver);
  }
}

/**
 * attempts to get options from a location (if they exist), otherwise returns undefined
 * If prioroptionsLocation is passed, but nothing is there, this errors.
 */
const getOptions = (_log: pino.BaseLogger, optionsLocation: string | undefined): any | undefined => {
  if (optionsLocation) {
    return JSON.parse(fs.readFileSync(optionsLocation).toString());
  }
  return undefined;
};
