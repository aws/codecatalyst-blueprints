import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as pino from 'pino';
import yargs from 'yargs';
import { writeSynthDriver } from './driver';

export interface SynthesizeCliOptions extends yargs.Arguments {
  outdir: string;
  blueprint: string;
  options: string;
  existingBundle?: string;
  cache: boolean;
}
export type SynthesisRunTime = 'node' | 'ts-node';
export interface SynthOptions {
  blueprintPath: string;
  runtime: SynthesisRunTime;
  blueprintOptions: any;
  jobname: string;

  /**
   * Creates the output directory if it doesn't exist
   */
  outputDirectory: string;
  driverFile?: string;

  /**
   * This nukes files at the synthesis target location prior to synthesis if set.
   * @default false
   */
  cleanTargetLocation?: boolean;
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

  const driverFile =
    options.driverFile || writeSynthDriver(path.join(options.blueprintPath, 'synth-driver.ts'), path.join(options.blueprintPath, 'src', 'index.ts'));

  log.debug(`Using driver: ${driverFile}`);
  try {
    // if something already exists at the synthesis location, we remove it.
    if (options.cleanTargetLocation) {
      log.debug('cleaning up existing code at synth location: %s', options.outputDirectory);
      const cleanCommand = `rm -rf ${options.outputDirectory}`;
      cp.execSync(cleanCommand, {
        stdio: 'inherit',
        cwd: options.blueprintPath,
      });
    }

    const timeStart = Date.now();
    executeSynthesisCommand(log, options.blueprintPath, options.jobname, {
      driverFile,
      outputDirectory: options.outputDirectory,
      options: options.blueprintOptions,
      runtime: options.runtime,
      entropy: String(Math.floor(Date.now() / 100)),
    });
    const timeEnd = Date.now();

    log.debug(`Synth Time: [${timeEnd - timeStart} ms]`);
  } catch (e) {
    throw e;
  } finally {
    // if I wrote the synth driver, then also clean it up.
    if (!options.driverFile) {
      log.debug('Cleaning up synth driver: %s', driverFile);
      cp.execSync(`rm ${driverFile}`, {
        stdio: 'inherit',
        cwd: options.blueprintPath,
      });
    }
  }
}

const validateSynthOptions = (log: pino.BaseLogger, options: SynthOptions) => {
  const { blueprintPath, runtime, blueprintOptions, jobname, outputDirectory } = options;

  log.debug(`Job: ${jobname}`);
  log.debug(`Using blueprint: ${blueprintPath}`);
  log.debug(`Using runtime: ${runtime}`);
  log.debug(`Outputting to: ${outputDirectory}`);
  log.debug(`Using options: ${JSON.stringify(blueprintOptions)}`);

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
    driverFile: string;
    outputDirectory: string;
    entropy: string;
    options: any;
    executePrior?: string;
    commandPrefix?: string;

    /**
     * defaults to executing a synthesis with ts-node instead of node.
     */
    runtime: 'node' | 'ts-node';
  },
) {
  if (options.executePrior) {
    cp.execSync(options.executePrior, {
      stdio: 'inherit',
      cwd,
    });
  }

  cp.execSync(`mkdir -p ${options.outputDirectory}`, {
    stdio: 'inherit',
    cwd,
  });
  const synthCommand = [
    `${options.commandPrefix || ''}`,
    `npx ${options.runtime} `,
    `${options.driverFile} `,
    `'${JSON.stringify(options.options)}' `,
    `'${options.outputDirectory}' `,
    `'${options.entropy}'`,
  ].join('');

  logger.debug(`[${jobname}] Synthesis Command: ${synthCommand}`);
  cp.execSync(synthCommand, {
    stdio: 'inherit',
    cwd,
  });
}
