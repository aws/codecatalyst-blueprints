import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as deepmerge from 'deepmerge';
import * as pino from 'pino';
import yargs from 'yargs';
import { createCache } from './cache';
import { SYNTH_TS_NAME, writeSynthDriver } from './driver';
import { DriverFile, synthesize } from './synth';

export interface SynthDriverCliOptions extends yargs.Arguments {
  blueprint: string;
  outdir: string;
  defaultOptions: string;
  additionalOptions?: string;
  cache?: boolean;
  existingBundle?: string;
  /**
   * defaults to '00.synth.'
   */
  jobPrefix?: string;
}

/**
 * I call synth on a blueprint
 * 1. I expect the blueprint to then figure out which type of synthesis i'm running
 *  a. normal quick synthesis
 *  b. cache synthesis
 *    c. build a cache
 * 2. figure out where my synthesis will end up going
 * 2. figure out the option(s) the blueprint will take
 * 3. run a synthesis for each
 * @param log
 * @param options
 */
export function driveSynthesis(log: pino.BaseLogger, options: SynthDriverCliOptions): void {
  //validate options
  //TODO

  // we want one driver file that we execute multiple times with different options
  const driver = makeDriverFile(log, options);

  //figure out which options we have, call synthesis for each of these options
  const wizardConfigurations = getWizardOptions(log, options);

  try {
    wizardConfigurations.forEach(wizardOption => {
      const jobname = `${options.jobPrefix || '00.synth.'}${path.parse(wizardOption.path).base}`;
      const outputDir = path.join(options.outdir, `${jobname}`);
      log.info('==========================================');
      log.info(`[${jobname}]`);
      log.info(
        `npx blueprint synth --options merge[${options.defaultOptions},${wizardOption.path}] --blueprint ${options.blueprint} --outdir ${outputDir} ${
          (options.cache && '--cache') || ''
        }`,
      );
      log.info('==========================================');
      synthesize(log, {
        blueprintPath: options.blueprint,
        synthDriver: driver,
        blueprintOptions: wizardOption.option,
        jobname,
        outputDirectory: outputDir,
      });
    });
  } catch (error) {
    log.error(error as any);
  } finally {
    log.debug('Cleaning up synth driver: %s', driver.path);
    cp.execSync(`rm ${driver.path}`, {
      stdio: 'inherit',
      cwd: options.blueprint,
    });
  }
}

const makeDriverFile = (log: pino.BaseLogger, options: SynthDriverCliOptions): DriverFile => {
  const driver: DriverFile = {
    runtime: 'ts-node',
    path: '',
  };
  if (options.cache) {
    let { synthDriver } = createCache(log, {
      buildDirectory: path.join(options.blueprint, 'lib'),
      builtEntryPoint: './index.js',
    });
    driver.runtime = 'node';
    driver.path = synthDriver;
    log.debug(`creating cache, executing with ${driver.runtime} ${driver.path}`);
  } else {
    driver.path = writeSynthDriver(path.join(options.blueprint, SYNTH_TS_NAME), path.join(options.blueprint, 'src', 'index.ts'));
  }
  return driver;
};

/**
 * construct an array of objects, each representing a deep merged wizard configuration
 * @param log
 * @param options
 * @returns
 */
const getWizardOptions = (log: pino.BaseLogger, options: SynthDriverCliOptions): any[] => {
  const additionalWizardOptionPath: string[] = [];
  if (options.additionalOptions && fs.existsSync(options.additionalOptions)) {
    fs.readdirSync(options.additionalOptions, { withFileTypes: true }).forEach(overridePath => {
      additionalWizardOptionPath.push(path.join(options.additionalOptions!, overridePath.name));
    });
  }
  if (!additionalWizardOptionPath.length) {
    log.debug(`No options found at ${options.additionalOptions}, using ${options.defaultOptions} instead`);
    additionalWizardOptionPath.push(options.defaultOptions);
  }
  log.debug(`Synthesizing with options in: ${JSON.stringify(additionalWizardOptionPath)}`);
  log.debug(`Options deep merged over: ${JSON.stringify(options.defaultOptions)}`);

  const defaultOptions: any = JSON.parse(fs.readFileSync(options.defaultOptions).toString());
  const wizardOptions = additionalWizardOptionPath.map(overridePath => {
    const partialOverride: any = JSON.parse(fs.readFileSync(overridePath).toString());
    return {
      path: overridePath,
      option: deepmerge.all([defaultOptions, partialOverride], {
        arrayMerge(target, _source, _options?) {
          return target;
        },
      }),
    };
  });

  return wizardOptions;
};
