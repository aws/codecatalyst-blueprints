#!/usr/bin/env node

import * as pino from 'pino';
import * as yargs from 'yargs';

import { hideBin } from 'yargs/helpers';
import { AstOptions, buildAst } from './build-ast';
import { PublishOptions, publish } from './publish';
import { SynthesizeOptions, synth } from './synth-driver/synth';

const log = pino.default({
  prettyPrint: true,
  level: process.env.LOG_LEVEL || 'debug',
});

log.info('started');

// eslint-disable-next-line @typescript-eslint/no-floating-promises
yargs
  .default(hideBin(process.argv))
  .command({
    command: 'synth <blueprint>',
    describe: 'locally synthesize the blueprint',
    builder: (args: yargs.Argv<unknown>) => {
      return args
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
        })
        .option('cache', {
          description: 'Generate and synth from a webpacked cache',
          default: false,
          type: 'boolean',
        });
    },
    handler: async (argv: SynthesizeOptions): Promise<void> => {
      await synth(log, argv.blueprint, argv.outdir, argv.cache, argv.options);
      process.exit(0);
    },
  })
  .command({
    command: 'publish <blueprint>',
    describe: 'publishes a bueprint',
    builder: (args: yargs.Argv<unknown>) => {
      return args
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
        })
        .option('endpoint', {
          description: 'the code.aws endpoint to publish against',
          demandOption: false,
          type: 'string',
          default: 'api-gamma.quokka.codes',
        });
    },
    handler: async (argv: PublishOptions): Promise<void> => {
      await publish(log, argv.blueprint, argv.publisher, argv.endpoint, argv.cookie);
      process.exit(0);
    },
  })
  .command({
    command: 'build-ast <blueprint>',
    describe: 'builds a blueprint ast',
    builder: (args: yargs.Argv<unknown>) => {
      return args
        .positional('blueprint', {
          describe: 'path to the blueprint file',
          type: 'string',
          demandOption: true,
        })
        .option('outdir', {
          describe: 'output directory for blueprint ast',
          type: 'string',
          demandOption: true,
        });
    },
    handler: async (argv: AstOptions): Promise<void> => {
      await buildAst(log, argv.blueprint, argv.outdir);
      process.exit(0);
    },
  })
  .usage('usage: $0 [command] [options]')
  .demandCommand(1).argv;
