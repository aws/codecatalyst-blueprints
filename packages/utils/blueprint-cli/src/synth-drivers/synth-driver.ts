import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as deepmerge from 'deepmerge';
import * as pino from 'pino';
import yargs from 'yargs';
import { createCache } from './cache';
import { writeSynthDriver } from './driver';
import { SynthesisRunTime, synthesize } from './synth';

export interface SynthDriverCliOptions extends yargs.Arguments {
  blueprint: string;
  outdir: string;
  defaultOptions: string;
  additionalOptions?: string;
  cache?: boolean;
  existingBundle?: string;
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

  let runtime: SynthesisRunTime = 'ts-node';
  let driverFile: string = '';

  if (options.cache) {
    runtime = 'node';
    driverFile = createCache(
      {
        buildDirectory: path.join(options.blueprint, 'lib'),
        builtEntryPoint: './index.js',
      },
      log,
    );
    log.debug(`creating cache, executing with a driver file at ${driverFile}`);
  }

  //figure out which options we have, call synthesis for each of these options
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

  try {
    driverFile = driverFile || writeSynthDriver(path.join(options.blueprint, 'synth-driver.ts'), path.join(options.blueprint, 'src', 'index.ts'));

    wizardOptions.forEach(wizardOption => {
      const jobname = `00.synth.${path.parse(wizardOption.path).base}`;
      const outputDir = path.join(options.outdir, `${jobname}`);
      log.info('==========================================');
      log.info(`[${jobname}]`);
      log.info('==========================================');
      synthesize(log, {
        blueprintPath: options.blueprint,
        runtime,
        blueprintOptions: wizardOption.option,
        jobname,
        outputDirectory: outputDir,
        driverFile,
        cleanTargetLocation: true,
      });
    });
  } catch (error) {
    log.error(error as any);
  } finally {
    log.debug('Cleaning up synth driver: %s', driverFile);
    cp.execSync(`rm ${driverFile}`, {
      stdio: 'inherit',
      cwd: options.blueprint,
    });
  }
}
