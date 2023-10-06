import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as deepmerge from 'deepmerge';
import * as pino from 'pino';
import yargs from 'yargs';
import { createCache } from './cache';
import { SYNTH_TS_NAME, writeSynthDriver } from './driver';
import { DriverFile, synthesize } from './synth';
import { RESYNTH_TS_NAME, writeResynthDriver } from '../resynth-drivers/driver';
import { PROPOSED_BUNDLE_SUBPATH } from '../resynth-drivers/resynth';

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
  cleanUp: boolean;
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
export async function driveSynthesis(log: pino.BaseLogger, options: SynthDriverCliOptions) {
  //validate options
  //TODO

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
      const jobname = `${options.jobPrefix || '00.synth.'}${path.parse(wizardOption.path).base}`;
      const outputDir = path.join(options.outdir, `${jobname}`, PROPOSED_BUNDLE_SUBPATH);
      log.info('==========================================');
      log.info(`[${jobname}]`);
      log.info(
        [
          'npx blueprint synth',
          `--options merge[${options.defaultOptions},${wizardOption.path}]`,
          `--blueprint ${options.blueprint}`,
          `--outdir ${outputDir}`,
          `${(options.cache && '--cache') || ''}`,
        ].join(' '),
      );
      log.info('==========================================');
      void (await synthesize(log, {
        blueprintPath: options.blueprint,
        synthDriver,
        blueprintOptions: wizardOption.option,
        jobname,
        outputDirectory: outputDir,
        existingBundle: options.existingBundle || '',
        cleanUp: false,
      }));
    };
  } catch (error) {
    log.error(error as any);
  } finally {
    if (options.cleanUp === true) {
      cleanUpDriver(log, synthDriver);
      cleanUpDriver(log, resynthDriver);
    }
  }
}

export const makeDriverFile = async (
  log: pino.BaseLogger,
  options: {
    blueprint: string;
    cache?: boolean;
  },
): Promise<{
  synthDriver: DriverFile;
  resynthDriver: DriverFile;
}> => {
  if (options.cache) {
    const runtime = 'node';
    let { synthDriver, resynthDriver } = await createCache(log, {
      buildDirectory: path.join(options.blueprint, 'lib'),
      builtEntryPoint: './index.js',
    });
    log.debug(`creating cache, executing with ${runtime} ${resynthDriver}`);
    return {
      synthDriver: {
        runtime,
        path: synthDriver,
      },
      resynthDriver: {
        runtime,
        path: resynthDriver,
      },
    };
  }

  const runtime = 'ts-node';
  return {
    synthDriver: {
      runtime,
      path: writeSynthDriver(path.join(options.blueprint, SYNTH_TS_NAME), path.join(options.blueprint, 'src', 'index.ts')),
    },
    resynthDriver: {
      runtime,
      path: writeResynthDriver(path.join(options.blueprint, RESYNTH_TS_NAME), path.join(options.blueprint, 'src', 'index.ts')),
    },
  };
};

export const cleanUpDriver = (log: pino.BaseLogger, file: DriverFile) => {
  log.debug(`Cleaning up driver: ${file.path}`);
  cp.execSync(`rm ${file.path}`, {
    stdio: 'inherit',
  });
};

/**
 * construct an array of objects, each representing a deep merged wizard configuration
 * @param log
 * @param options
 * @returns
 */
export const getWizardOptions = (
  log: pino.BaseLogger,
  options: {
    defaultOptionsLocation: string;
    additionalOptionsLocation?: string;
  },
): {
  path: string;
  option: any;
}[] => {
  const additionalWizardOptionPath: string[] = [];
  if (options.additionalOptionsLocation && fs.existsSync(options.additionalOptionsLocation)) {
    fs.readdirSync(options.additionalOptionsLocation, { withFileTypes: true }).forEach(overridePath => {
      additionalWizardOptionPath.push(path.join(options.additionalOptionsLocation!, overridePath.name));
    });
  }
  if (!additionalWizardOptionPath.length) {
    log.debug(`No options found at ${options.additionalOptionsLocation}, using ${options.defaultOptionsLocation} instead`);
    additionalWizardOptionPath.push(options.defaultOptionsLocation);
  }
  log.debug(`Synthesizing with options in: ${JSON.stringify(additionalWizardOptionPath)}`);
  log.debug(`Options deep merged over: ${JSON.stringify(options.defaultOptionsLocation)}`);

  const defaultOptions: any = JSON.parse(fs.readFileSync(options.defaultOptionsLocation).toString());
  const wizardOptions = additionalWizardOptionPath.map(overridePath => {
    const partialOverride: any = JSON.parse(fs.readFileSync(overridePath).toString());
    return {
      path: overridePath,
      option: deepmerge.all([defaultOptions, partialOverride], {
        arrayMerge(target, source, _options) {
          if (source) {
            return source;
          }
          return target;
        },
      }),
    };
  });

  return wizardOptions;
};
