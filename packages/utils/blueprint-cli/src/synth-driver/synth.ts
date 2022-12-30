import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as deepmerge from 'deepmerge';
import * as pino from 'pino';
import yargs from 'yargs';
import { createCache } from './cache';
import { writeSynthDriver } from './driver';

export interface SynthesizeCliOptions extends yargs.Arguments {
  blueprint: string;
  outdir: string;
  outdirExact: boolean;
  enableStableSynthesis: boolean;
  cache: boolean;

  options: string;
  /**
   * path to additional configurations that are merged on top of the defaults
   */
  additionalOptionOverrides?: string;
}

export interface SynthRun {
  /**
   * optional command line argument to execute before executing this run.
   */
  execPrior?: string;
  /**
   * This is the option used for a particular synth run (deep merged on top of the optionsPath)
   */
  optionOverridePath: string;

  /**
   * This is the output path used for that particular synth run
   */
  outputPath: string;
}

export interface SynthOptions {
  useCache: boolean;
  blueprintPath: string;
  /**
   * These are the base options given to the blueprint
   */
  defaultsPath: string;
  runs: SynthRun[];
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
export async function synthesize(log: pino.BaseLogger, options: SynthOptions): Promise<void> {
  validateSynthOptions(log, {
    blueprintDirectory: options.blueprintPath,
    optionsPaths: [options.defaultsPath, ...options.runs.map(output => output.optionOverridePath)],
    buildCache: options.useCache,
  });

  let driverFile;
  try {
    let runtime: 'node' | 'ts-node';
    if (options.useCache) {
      log.info('Generating a cache');
      // driving synthesis from a cache
      driverFile = createCache(
        {
          buildDirectory: path.join(options.blueprintPath, 'lib'),
          builtEntryPoint: './index.js',
        },
        log,
      );
      runtime = 'node';
    } else {
      // driving synthesis from a ts synth-driver file
      driverFile = path.join(options.blueprintPath, 'synth-driver.ts');
      writeSynthDriver(driverFile, path.join(options.blueprintPath, 'src', 'index.ts'));
      runtime = 'ts-node';
    }

    const synthesisDefaultOptions = JSON.parse(fs.readFileSync(options.defaultsPath, 'utf-8'));
    const synthEntropy = String(Math.floor(Date.now() / 100));
    options.runs.forEach(run => {
      const override = JSON.parse(fs.readFileSync(run.optionOverridePath, 'utf-8'));
      const blueprintOptions = deepmerge.all([synthesisDefaultOptions, override], {
        arrayMerge(target, _source, _options?) {
          return target;
        },
      });
      executeSynthesisDriver(log, options.blueprintPath, path.parse(run.optionOverridePath).base, {
        driverFile,
        outputDirectory: run.outputPath,
        options: blueprintOptions,
        runtime,
        entropy: synthEntropy,
        executePrior: run.execPrior,
      });
    });
  } catch (e) {
    throw e;
  } finally {
    log.debug('cleaning up synth driver: %s', driverFile);
    cp.execSync(`rm ${driverFile}`, {
      stdio: 'inherit',
      cwd: options.blueprintPath,
    });
  }
}

const validateSynthOptions = (
  log: pino.BaseLogger,
  options: {
    blueprintDirectory: string;
    optionsPaths: string[];
    buildCache: boolean;
  },
) => {
  const { optionsPaths, blueprintDirectory } = options;

  if (options.buildCache) {
    const buildDirectory = path.join(options.blueprintDirectory, 'lib');
    const builtEntryPoint = './index.js';
    log.debug('Creating cache from built: %s', buildDirectory);
    log.debug('Creating cache from built blueprint: %s', builtEntryPoint);
    if (!fs.existsSync(buildDirectory) && !fs.existsSync(path.join(buildDirectory, builtEntryPoint))) {
      log.debug('Did you forget to build?');
      log.error('Blueprint entrypoint not found: %s', builtEntryPoint);
      process.exit(255);
    }
  }

  if (!fs.existsSync(blueprintDirectory)) {
    log.error('blueprint directory does not exist: %s', blueprintDirectory);
    process.exit(255);
  }

  optionsPaths.forEach(optionsPath => {
    if (!fs.existsSync(optionsPath)) {
      log.error('Options file did not exist at : %s', optionsPath);
      process.exit(255);
    }
  });
};
function executeSynthesisDriver(
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
