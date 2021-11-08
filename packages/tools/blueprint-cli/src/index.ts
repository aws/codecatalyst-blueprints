#!/usr/bin/env node

import * as pino from 'pino';
import * as yargs from 'yargs';

import {PublishOptions, publish} from './publish';
import {SynthesizeOptions, synth} from './synth';

import {Argv} from 'yargs';
import {hideBin} from 'yargs/helpers';
import { AstOptions, buildAst } from './build-ast';

const log = pino({
  prettyPrint: true,
  level: process.env.LOG_LEVEL || 'debug',
});

log.info('started');

// eslint-disable-next-line @typescript-eslint/no-floating-promises
yargs(hideBin(process.argv))
  .command({
    command: 'synth <blueprint>',
    describe: 'locally synthesize the blueprint',
    builder: (yargs: Argv<unknown>) => {
      return yargs
        .positional('blueprint', {
          describe: 'path to the blueprint package directory',
          type: 'string',
          demandOption: true,
        })
        .option('outdir', {
          describe: 'output directory for blueprint synthesis',
          type: 'string',
          demandOption: true,
        })
        .option('defaults', {
          description: 'path to defaults.json to feed default values into synthesis',
          type: 'string',
        });
    },
    handler: async (argv: SynthesizeOptions): Promise<void> => {
      await synth(log, argv.blueprint, argv.outdir, argv.options);
      process.exit(0);
    },
  })
  .command({
    command: 'publish <blueprint>',
    describe: 'publishes a bueprint',
    builder: (yargs: Argv<unknown>) => {
      return yargs
        .positional('blueprint', {
          describe: 'path to the blueprint package directory',
          type: 'string',
          demandOption: true,
        })
        .option('publisher', {
          description: 'the name of the publishing organization',
          demandOption: true,
          type: 'string',
        })
        .option('cookie', {
          description: 'the code.aws cookie to use for authorization',
          demandOption: false,
          type: 'string',
        });
    },
    handler: async (argv: PublishOptions): Promise<void> => {
      await publish(log, argv.blueprint, argv.publisher, argv.cookie);
      process.exit(0);
    },
  })
  .command({
    command: 'build-ast <blueprint>',
    describe: 'builds a blueprint ast',
    builder: (yargs: Argv<unknown>) => {
      return yargs
        .positional('blueprint', {
          describe: 'path to the blueprint file',
          type: 'string',
          demandOption: true,
        })
        .option('outdir', {
          describe: 'output directory for blueprint ast',
          type: 'string',
          demandOption: true,
        })
    },
    handler: async (argv: AstOptions): Promise<void> => {
      await buildAst(log, argv.blueprint, argv.outdir);
      process.exit(0);
    },
  })
  .usage('usage: $0 [command] [options]')
  .demandCommand(1).argv;
