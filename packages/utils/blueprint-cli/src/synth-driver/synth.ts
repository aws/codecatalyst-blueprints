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
  options?: string;
}

export async function synth(
  log: pino.BaseLogger,
  { blueprint, outdir, outdirExact, enableStableSynthesis, useCache, options }: SynthesizeOptions,
): Promise<void> {
  if (!fs.existsSync(blueprint)) {
    log.error('blueprint directory does not exist: %s', blueprint);
    process.exit(255);
  }

  const synthEntropy = String(Math.floor(Date.now() / 100));
  const synthDirectory = outdirExact
    ? path.resolve(outdir)
    : path.resolve(path.join(outdir, 'synth', synthEntropy));
  const withStableSynthDirectory = (f) => {
    if (enableStableSynthesis) {
      return f(path.resolve(path.join(outdir, 'synth', '00.latest.synth')));
    }
  };

  cp.execSync(`mkdir -p ${synthDirectory}`, {
    stdio: 'inherit',
  });

  withStableSynthDirectory((stableSynthDirectory) => {
    cp.execSync(`mkdir -p ${stableSynthDirectory}`, {
      stdio: 'inherit',
    });
  });

  let loadedOptions = {};
  if (options) {
    if (!fs.existsSync(options)) {
      log.error('options file did not exist: %s', options);
      process.exit(255);
    }
    loadedOptions = {
      ...JSON.parse(fs.readFileSync(options, 'utf-8')),
    };
  }

  if (useCache) {
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
      options: loadedOptions,
      outputDirectory: synthDirectory,
      entropy: synthEntropy,
      useNode: true,
    });

    withStableSynthDirectory((stableSynthDirectory) => {
      doSynthesis(log, blueprint, 'STABLE CACHE', {
        driverFile: synthExecutionFile,
        options: loadedOptions,
        outputDirectory: stableSynthDirectory,
        entropy: synthEntropy,
        commandPrefix: `rm -rf ${stableSynthDirectory}/* && `,
        useNode: true,
      });
    });
  } else {
    const driverFile = path.join(blueprint, 'synth-driver.ts');
    console.log(driverFile);
    try {
      writeSynthDriver(driverFile, path.join(blueprint, 'src', 'index.ts'));

      doSynthesis(log, blueprint, 'NEW', {
        driverFile,
        options: loadedOptions,
        outputDirectory: synthDirectory,
        entropy: synthEntropy,
      });

      withStableSynthDirectory((stableSynthDirectory) => {
        doSynthesis(log, blueprint, 'STABLE', {
          driverFile,
          options: loadedOptions,
          outputDirectory: stableSynthDirectory,
          entropy: synthEntropy,
          commandPrefix: `rm -rf ${stableSynthDirectory}/* && `,
        });
      });
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
  const synthCommand = `${options.commandPrefix || ''}npx ${runtime} ${options.driverFile} '${JSON.stringify(options.options)}' '${
    options.outputDirectory
  }' '${options.entropy}'`;
  logger.debug(`[${jobname}] Synthesis Command: ${synthCommand}`);
  cp.execSync(synthCommand, {
    stdio: 'inherit',
    cwd,
  });
}
