import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as pino from 'pino';
import * as yargs from 'yargs';
import { createCache } from './cache';
import { writeSynthDriver } from './driver';

export interface SynthesizeOptions extends yargs.Arguments {
  blueprint: string;
  outdir: string;
  outdirExact: boolean;
  enableStableSynthesis: boolean;
  cache: boolean;
  defaults?: string;
}

interface ValidationResult {
  options: any;
  optionsFileName: any;
}
const validateSynth = (log: pino.BaseLogger, options: {
  blueprintDirectory: string;
  optionsPath: string;
}): ValidationResult => {
  const {optionsPath, blueprintDirectory} = options;

  if (!fs.existsSync(blueprintDirectory)) {
    log.error('blueprint directory does not exist: %s', blueprintDirectory);
    process.exit(255);
  }

  let loadedOptions = {};
  if (optionsPath) {
    if (!fs.existsSync(optionsPath)) {
      log.error('Options file did not exist: %s', optionsPath);
      process.exit(255);
    }
    loadedOptions = {
      ...JSON.parse(fs.readFileSync(optionsPath, 'utf-8')),
    };
  }
  return {
    options: loadedOptions,
    optionsFileName: path.parse(optionsPath).base
  };
}

export async function synth(log: pino.BaseLogger, synthOptions: SynthesizeOptions): Promise<void> {
  const { blueprint, outdir, outdirExact, enableStableSynthesis, cache, defaults } = synthOptions;
  console.log(`cache ${cache}`);
  const {options, optionsFileName} = validateSynth(log, {
    blueprintDirectory: blueprint,
    optionsPath: defaults || '',
  });

  const synthEntropy = String(Math.floor(Date.now() / 100));
  let synthDirectory = '';
  if (outdirExact) {
    synthDirectory = outdir;
  } else {
    synthDirectory = path.resolve(path.join(outdir, 'synth', synthEntropy));
  }

  let stableSynthDirectory: string | undefined = undefined;
  if (enableStableSynthesis) {
    stableSynthDirectory = path.resolve(path.join(outdir, 'synth', `00.latest.${optionsFileName}`));
  }

  cp.execSync(`mkdir -p ${synthDirectory}`, {
    stdio: 'inherit',
  });

  if (stableSynthDirectory) {
    cp.execSync(`mkdir -p ${stableSynthDirectory}`, {
      stdio: 'inherit',
    });
  }

  console.log(`usage cache?, ${cache}`);
  if (cache) {
    const buildDirectory = path.join(blueprint, 'lib');
    const builtEntryPoint = './index.js';
    log.debug('Creating cache from built: %s', buildDirectory);
    log.debug('Creating cache from built blueprint: %s', builtEntryPoint);
    if (!fs.existsSync(buildDirectory) && !fs.existsSync(path.join(buildDirectory, builtEntryPoint))) {
      log.debug('Did you forget to build?');
      log.error('Blueprint entrypoint not found: %s', builtEntryPoint);
      process.exit(255);
    }

    const synthExecutionFile = createCache(
      {
        buildDirectory,
        builtEntryPoint,
      },
      log,
    );

    doSynthesis(log, blueprint, 'NEW CACHE', {
      driverFile: synthExecutionFile,
      options,
      outputDirectory: synthDirectory,
      entropy: synthEntropy,
      useNode: true,
    });

    if (stableSynthDirectory) {
      doSynthesis(log, blueprint, 'STABLE CACHE', {
        driverFile: synthExecutionFile,
        options,
        outputDirectory: stableSynthDirectory,
        entropy: synthEntropy,
        commandPrefix: `rm -rf ${stableSynthDirectory}/* && `,
        useNode: true,
      });
    }
  } else {
    const driverFile = path.join(blueprint, 'synth-driver.ts');
    console.log(driverFile);
    try {
      writeSynthDriver(driverFile, path.join(blueprint, 'src', 'index.ts'));

      doSynthesis(log, blueprint, 'NEW', {
        driverFile,
        options,
        outputDirectory: synthDirectory,
        entropy: synthEntropy,
      });

      if (stableSynthDirectory) {
        doSynthesis(log, blueprint, 'STABLE', {
          driverFile,
          options,
          outputDirectory: stableSynthDirectory,
          entropy: synthEntropy,
          commandPrefix: `rm -rf ${stableSynthDirectory}/* && `,
        });
      }
    } catch (e) {
      throw e;
    } finally {
      log.debug('cleaning up synth driver: %s', driverFile);
      cp.execSync(`rm ${driverFile}`, {
        stdio: 'inherit',
        cwd: blueprint,
      });
    }
  }
}

function doSynthesis(
  logger: pino.BaseLogger,
  cwd: string,
  jobname: string,
  options: {
    driverFile: string;
    outputDirectory: string;
    entropy: string;
    options: any;
    commandPrefix?: string;

    /**
     * defaults to executing a synthesis with ts-node instead of node.
     */
    useNode?: boolean;
  },
) {
  const runtime = options.useNode ? 'node' : 'ts-node';
  const synthCommand = [
    `${options.commandPrefix || ''}`,
    `npx ${runtime} `,
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
