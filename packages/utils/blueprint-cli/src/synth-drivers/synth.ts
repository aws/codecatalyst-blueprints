import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as pino from 'pino';
import yargs from 'yargs';
import { SYNTH_TS_NAME, writeSynthDriver } from './driver';

export interface SynthesizeCliOptions extends yargs.Arguments {
  outdir: string;
  blueprint: string;
  options: string;
  existingBundle?: string;
  cache: boolean;
}
export type SynthesisRunTime = 'node' | 'ts-node';
export interface DriverFile {
  path: string;
  runtime: SynthesisRunTime;
}
export interface SynthOptions {
  blueprintPath: string;
  blueprintOptions: any;
  jobname: string;

  /**
   * Creates the output directory if it doesn't exist
   */
  outputDirectory: string;

  /**
   * Path to existing bundle context codebase
   */
  existingBundle?: string;

  synthDriver?: DriverFile;
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
export function synthesize(log: pino.BaseLogger, options: SynthOptions): void {
  validateSynthOptions(log, options);

  const synthDriver: DriverFile = makeSynthDriverFile(log, options);

  log.debug(`Using driver:${synthDriver.runtime} ${synthDriver.path}`);
  try {
    // if something already exists at the synthesis location, we remove it.
    log.debug('cleaning up existing code at synth location: %s', options.outputDirectory);
    const cleanCommand = `rm -rf ${options.outputDirectory}`;
    cp.execSync(cleanCommand, {
      stdio: 'inherit',
      cwd: options.blueprintPath,
    });

    const timeStart = Date.now();
    executeSynthesisCommand(log, options.blueprintPath, options.jobname, {
      driver: synthDriver,
      outputDirectory: options.outputDirectory,
      options: options.blueprintOptions,
      entropy: String(Math.floor(Date.now() / 100)),
      existingBundleDirectory: options.existingBundle,
    });
    const timeEnd = Date.now();

    log.debug(`Synth Time: [${timeEnd - timeStart} ms]`);
  } catch (e) {
    throw e;
  } finally {
    // if I wrote the synth driver, then also clean it up.
    if (!options.synthDriver) {
      log.debug('Cleaning up synth driver: %s', synthDriver.path);
      cp.execSync(`rm ${synthDriver.path}`, {
        stdio: 'inherit',
        cwd: options.blueprintPath,
      });
    }
  }
}

const validateSynthOptions = (log: pino.BaseLogger, options: SynthOptions) => {
  const { blueprintPath, blueprintOptions, jobname, outputDirectory } = options;
  log.debug(`Job: ${jobname}`);
  log.debug(`Using blueprint: ${blueprintPath}`);
  log.debug(`Outputting to: ${outputDirectory}`);
  log.debug(`Using options: ${JSON.stringify(blueprintOptions)}`);

  if (options.existingBundle && options.existingBundle == options.outputDirectory) {
    log.error(
      `blueprint synthesis is being run with an existing context from ${options.existingBundle} and outputted to ${options.outputDirectory}. They cannot be the same.`,
    );
  }

  if (!fs.existsSync(blueprintPath)) {
    log.error('blueprint directory does not exist: %s', blueprintPath);
    process.exit(255);
  }
};

function executeSynthesisCommand(
  logger: pino.BaseLogger,
  cwd: string,
  jobname: string,
  options: {
    driver: DriverFile;
    outputDirectory: string;
    entropy: string;
    options: any;
    existingBundleDirectory?: string;
  },
) {
  cp.execSync(`mkdir -p ${options.outputDirectory}`, {
    stdio: 'inherit',
    cwd,
  });
  const synthCommand = [
    `npx ${options.driver.runtime}`,
    `${options.driver.path}`,
    `'${JSON.stringify(options.options)}'`,
    `'${options.outputDirectory}'`,
    `'${options.entropy}'`,
  ].join(' ');

  logger.debug(`[${jobname}] Synthesis Command: ${synthCommand}`);
  cp.execSync(synthCommand, {
    stdio: 'inherit',
    cwd,
    env: {
      EXISTING_BUNDLE_ABS: options.existingBundleDirectory && path.resolve(options.existingBundleDirectory || ''),
      ...process.env,
    },
  });
}

const makeSynthDriverFile = (_log: pino.BaseLogger, options: SynthOptions): DriverFile => {
  if (options.synthDriver) {
    return options.synthDriver;
  }

  return {
    path: writeSynthDriver(path.join(options.blueprintPath, SYNTH_TS_NAME), path.join(options.blueprintPath, 'src', 'index.ts')),
    runtime: 'ts-node',
  };
};
