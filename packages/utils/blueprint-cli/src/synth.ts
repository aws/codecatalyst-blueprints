import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as pino from 'pino';
import * as yargs from 'yargs';

export interface SynthesizeOptions extends yargs.Arguments {
  blueprint: string;
  outdir: string;
  options?: string;
}

export async function synth(
  log: pino.BaseLogger,
  blueprint: string,
  outdir: string,
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

  let loadedOptions = {
    outdir,
  };

  if (options) {
    if (!fs.existsSync(options)) {
      log.error('options file did not exist: %s', options);
      process.exit(255);
    }

    loadedOptions = {
      ...loadedOptions,
      ...JSON.parse(fs.readFileSync(options, 'utf-8')),
    };
  }

  const blueprintDefinitionPath = path.join(blueprint, 'src', 'blueprint.ts');
  if (!fs.existsSync(blueprintDefinitionPath)) {
    log.error('blueprint definition file not found: %s', blueprintDefinitionPath);
    process.exit(255);
  }

  const command = `echo 'import {Blueprint} from "./src/blueprint";const b=new Blueprint(${JSON.stringify(
    loadedOptions,
  )});b.synth();' | npx ts-node`;

  log.debug('generated command: %s', command);

  cp.execSync(command, {
    stdio: 'inherit',
    cwd: blueprint,
  });
}
