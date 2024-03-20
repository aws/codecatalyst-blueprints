#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies */
import * as pino from 'pino';
import * as yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { stableLink } from './stable-link/stable-link';

export * from './stable-link/stable-link';

const log = pino.default({
  level: process.env.LOG_LEVEL || 'debug',
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
yargs
  .default(hideBin(process.argv))
  //open command
  .command({
    command: 'verbose',
    describe: 'Stable link generator with verbose options',
    builder: (args: yargs.Argv<unknown>) => {
      return args
        .option('blueprint', {
          describe: 'This is the name of the blueprint you are importing. This blueprint must be available in the space or otherwise public.',
          type: 'string',
          demandOption: false,
        })
        .option('options', {
          describe: 'Path to an options JSON. This will be used to prepopulate the blueprint',
          type: 'string',
          demandOption: false,
        })
        .option('version', {
          describe: 'version of the blueprint',
          type: 'string',
          default: 'latest',
          demandOption: false,
        })
        .option('publisherId', {
          describe: 'Id of the blueprint publisher space',
          type: 'string',
          demandOption: false,
        })
        .option('endpoint', {
          describe: 'endpoint to generate the link against',
          type: 'string',
          demandOption: false,
          default: 'codecatalyst.aws',
        });
    },
    handler: async (argv): Promise<void> => {
      argv = useOverrideOptionals(argv);
      const publicStableLink = stableLink({
        endpoint: argv.endpoint,
        query: {
          blueprintPackage: argv.blueprint,
          publisher: argv.publisherId,
          version: argv.version,
          options: argv.options,
        },
      });

      log.info('Access CodeCatalyst public stable link at:');
      log.info('=================================');
      log.debug(publicStableLink);
      log.info('=================================');
      process.exit(0);
    },
  })
  .usage('usage: $0 [command] [options]')
  .demandCommand(1).argv;

/**
 * If an option is passed more than once,respect the last given option.
 * e.g. yarn resynth --existing-bundle ./synth/resynth-01/resolved-bundle/
 * @param arg
 * @returns
 */
function useOverrideOptionals<T extends {}>(arg: T): T {
  function useLastElement<S>(element: S | S[]): S {
    if (Array.isArray(element)) {
      return element[element.length - 1];
    }
    return element;
  }
  for (const [key, value] of Object.entries(arg)) {
    arg[key] = useLastElement(value);
  }
  return arg;
}
