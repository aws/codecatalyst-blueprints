import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as pino from 'pino';
import * as yargs from 'yargs';
import { writeSynthDiver } from './synth-driver';

export interface SynthesizeOptions extends yargs.Arguments {
  blueprint: string;
  outdir: string;
  cache: boolean;
  options?: string;
}

export async function synth(
  log: pino.BaseLogger,
  blueprint: string,
  outdir: string,
  useCache: boolean,
  options?: string,
): Promise<void> {
  if (!fs.existsSync(blueprint)) {
    log.error('blueprint directory does not exist: %s', blueprint);
    process.exit(255);
  }

  outdir = path.resolve(path.join(outdir, 'synth'));
  if (!fs.existsSync(outdir)) {
    fs.mkdirSync(outdir);
  }

  outdir = path.join(outdir, String(Math.floor(Date.now() / 100)));
  fs.mkdirSync(outdir);

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

  let blueprintEntryPoint = path.join(blueprint, 'src', 'index.ts');
  let driverFile = path.join(blueprint, 'synth-driver.ts');
  let builtPath = path.join(blueprint, 'lib');

  // check that entrypoints exist
  if (!fs.existsSync(blueprintEntryPoint)) {
    log.error('blueprint entrypoint not found: %s', blueprintEntryPoint);
    process.exit(255);
  }

  // check that a built entrypoint exists
  if (useCache) {
    blueprintEntryPoint = path.join(builtPath, 'index.js');
    driverFile = path.join(blueprint, 'synth-driver.js');

    log.debug('Using built entrypoint: %s', blueprintEntryPoint);
    if (!fs.existsSync(blueprintEntryPoint)) {
      log.debug('Did you forget to build?');
      log.error('Blueprint entrypoint not found: %s', blueprintEntryPoint);
      process.exit(255);
    }
  }

  try {

    writeSynthDiver(driverFile, blueprintEntryPoint);
    cp.execSync(`cat ${driverFile}`, {
      stdio: 'inherit',
    });

    let command = '';
    if (useCache) {
      // build cache file by webpacking the driver
      const synthCache = 'synth-cache.production.js';
      const webpackCommand = `npx webpack --entry ./${driverFile}`+
      ' --target node' +
      ` --output-path ./${builtPath}` +
      ` --output-filename ${synthCache}` +
      ' --progress' +
      ' --mode development';

      log.debug('Webpacking with: %s', webpackCommand);
      cp.execSync(webpackCommand, {
        stdio: 'inherit',
        cwd: blueprint,
      });


      // execute the synthcache
      command = `npx node ${path.join(builtPath, synthCache)} '${JSON.stringify(loadedOptions)}' '${outdir}'`;
    } else {
      // execute the driver
      command = `npx ts-node ${driverFile} '${JSON.stringify(loadedOptions)}' '${outdir}'`;
    }

    log.debug('generated command: %s', command);
    cp.execSync(command, {
      stdio: 'inherit',
      cwd: blueprint,
    });


  } catch (error) {
    throw error;
  } finally {
    // cp.execSync(`rm ${driverFile}`);
  }
}
