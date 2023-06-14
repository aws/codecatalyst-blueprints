import * as fs from 'fs';
import * as path from 'path';
import * as pino from 'pino';
import * as yargs from 'yargs';

import { hideBin } from 'yargs/helpers';
import { AstOptions, buildAst } from './build-ast';
import { UploadOptions, uploadImagePublicly } from './image-upload-tool/upload-image-to-aws';
import { PublishOptions, publish } from './publish';
// import { resynthesize, ResynthesizeCliOptions } from './resynth/resynth';
import { createCache } from './synth-drivers/cache';
import { synthesize, SynthesizeCliOptions, SynthesisRunTime } from './synth-drivers/synth';
import { SynthDriverCliOptions, driveSynthesis } from './synth-drivers/synth-driver';
import { doOptionValidation } from './validate-options';

const log = pino.default({
  prettyPrint: true,
  level: process.env.LOG_LEVEL || 'debug',
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
yargs
  .default(hideBin(process.argv))
  //synth command
  .command({
    command: 'synth',
    describe: 'locally synthesize the blueprint with options',
    builder: (args: yargs.Argv<unknown>) => {
      return args
        .option('blueprint', {
          describe: 'path to the blueprint package directory',
          type: 'string',
          demandOption: true,
        })
        .option('outdir', {
          describe: 'output directory for blueprint synthesis. Will create if it does not exist.',
          type: 'string',
          demandOption: true,
        })
        .option('options', {
          description: 'path to defaults.json to feed default values into synthesis',
          type: 'string',
          demandOption: true,
        })
        .option('existing-bundle', {
          description: 'path to an existing bundle to use as blueprint context',
          type: 'string',
          default: undefined,
        })
        .option('cache', {
          description: 'Generate and synth from a webpacked cache',
          type: 'boolean',
          default: false,
        });
    },
    handler: async (argv: SynthesizeCliOptions): Promise<void> => {
      let runtime: SynthesisRunTime = 'ts-node';
      let driverFile: string | undefined = undefined;

      if (argv.cache) {
        runtime = 'node';
        driverFile = createCache(
          {
            buildDirectory: path.join(argv.blueprint, 'lib'),
            builtEntryPoint: './index.js',
          },
          log,
        );
        log.debug(`creating cache, executing with a driver file at ${driverFile}`);
      }

      await synthesize(log, {
        blueprintPath: argv.blueprint,
        runtime,
        blueprintOptions: JSON.parse(fs.readFileSync(argv.options, 'utf-8')),
        jobname: path.parse(argv.options).base,
        outputDirectory: argv.outdir,
        driverFile,
        cleanTargetLocation: true,
      });
      process.exit(0);
    },
  })
  // synth driver command
  .command({
    command: 'drive-synth',
    describe: 'Structure call(s) to the synth command',
    builder: (args: yargs.Argv<unknown>) => {
      return args
        .option('blueprint', {
          describe: 'path to the blueprint package directory',
          type: 'string',
          demandOption: true,
        })
        .option('outdir', {
          describe: 'output directory for blueprint synthesis',
          type: 'string',
          demandOption: true,
        })
        .option('default-options', {
          description: 'path to defaults.json to feed default values into synthesis',
          type: 'string',
          demandOption: true,
        })
        .option('additional-options', {
          description: 'path to additonal synthesis options',
          default: undefined,
          type: 'string',
        })
        .option('cache', {
          description: 'run synth against a cache',
          default: false,
          type: 'boolean',
        })
        .option('existing-bundle', {
          description: 'path to an existing bundle to use as blueprint context',
          type: 'string',
        });
    },
    handler: async (argv: SynthDriverCliOptions): Promise<void> => {
      await driveSynthesis(log, argv);
      process.exit(0);
    },
  })
  //resynth command
  // .command({
  //   command: 'resynth <blueprint>',
  //   describe: 'locally resynthesize the blueprint, using the defaults.json any wizard configs (if they exist)',
  //   builder: (args: yargs.Argv<unknown>) => {
  //     return args
  //       .positional('blueprint', {
  //         describe: 'path to the blueprint package directory',
  //         type: 'string',
  //         demandOption: true,
  //       })
  //       .option('outdir', {
  //         describe: 'output directory for blueprint resynthesis',
  //         type: 'string',
  //         demandOption: true,
  //       })
  //       .option('options', {
  //         description: 'path to defaults.json to feed default values into synthesis',
  //         type: 'string',
  //         demandOption: true,
  //       })
  //       .option('cache', {
  //         description: 'Generate and synth from a webpacked cache',
  //         default: false,
  //         type: 'boolean',
  //       })
  //       .option('additionalOverrides', {
  //         description: 'synthesize additional partial options over the default to a stable directory',
  //         type: 'string',
  //       });
  //   },
  //   handler: async (argv: ResynthesizeCliOptions): Promise<void> => {
  //     const runs: SynthRun[] = [
  //       {
  //         optionOverridePath: argv.options,
  //         outputPath: path.join(argv.outdir, 'synth', `00.resynth.${path.parse(argv.options).base}`),
  //       },
  //     ];

//     if (argv.additionalOptionOverrides) {
//       fs.readdirSync(argv.additionalOptionOverrides, { withFileTypes: true }).forEach(override => {
//         runs.push({
//           optionOverridePath: path.join(argv.additionalOptionOverrides!, override.name),
//           outputPath: path.resolve(path.join(argv.outdir, 'synth', `00.resynth.${override.name}`)),
//         });
//       });
//     }

//     await resynthesize(log, {
//       blueprintPath: argv.blueprint,
//       defaultsPath: argv.options || '',
//       useCache: argv.cache,
//       runs,
//     });
//     process.exit(0);
//   },
// })
//resynth driver command
// .command({
//   command: 'resynth <blueprint>',
//   describe: 'locally resynthesize the blueprint, using the defaults.json any wizard configs (if they exist)',
//   builder: (args: yargs.Argv<unknown>) => {
//     return args
//       .positional('blueprint', {
//         describe: 'path to the blueprint package directory',
//         type: 'string',
//         demandOption: true,
//       })
//       .option('outdir', {
//         describe: 'output directory for blueprint resynthesis',
//         type: 'string',
//         demandOption: true,
//       })
//       .option('options', {
//         description: 'path to defaults.json to feed default values into synthesis',
//         type: 'string',
//         demandOption: true,
//       })
//       .option('cache', {
//         description: 'Generate and synth from a webpacked cache',
//         default: false,
//         type: 'boolean',
//       })
//       .option('additionalOverrides', {
//         description: 'synthesize additional partial options over the default to a stable directory',
//         type: 'string',
//       });
//   },
//   handler: async (argv: ResynthesizeCliOptions): Promise<void> => {
//     const runs: SynthRun[] = [
//       {
//         optionOverridePath: argv.options,
//         outputPath: path.join(argv.outdir, 'synth', `00.resynth.${path.parse(argv.options).base}`),
//       },
//     ];

//     if (argv.additionalOptionOverrides) {
//       fs.readdirSync(argv.additionalOptionOverrides, { withFileTypes: true }).forEach(override => {
//         runs.push({
//           optionOverridePath: path.join(argv.additionalOptionOverrides!, override.name),
//           outputPath: path.resolve(path.join(argv.outdir, 'synth', `00.resynth.${override.name}`)),
//         });
//       });
//     }

  //     await resynthesize(log, {
  //       blueprintPath: argv.blueprint,
  //       defaultsPath: argv.options || '',
  //       useCache: argv.cache,
  //       runs,
  //     });
  //     process.exit(0);
  //   },
  // })
  //publish command
  .command({
    command: 'publish <blueprint>',
    describe: 'publishes a blueprint',
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
  //build-ast command
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
  //validate options command
  .command({
    command: 'validate-options <ast> <options>',
    describe: 'builds a blueprint ast',
    builder: (args: yargs.Argv<unknown>) => {
      return args
        .positional('ast', {
          describe: 'path to the blueprint ast',
          type: 'string',
          demandOption: true,
        })
        .positional('options', {
          describe: 'path to the blueprint options',
          type: 'string',
          demandOption: true,
        });
    },
    handler: async (argv: { ast: string; options: string }): Promise<void> => {
      const validation = doOptionValidation(argv.ast, argv.options);
      const warnings = validation.filter(error => error.level === 'WARNING');
      const errors = validation.filter(error => error.level === 'ERROR');
      if (warnings.length) {
        log.warn(JSON.stringify(warnings, null, 2));
      }
      if (errors.length) {
        log.error('ERROR: The AST and options do not validate');
        log.error(JSON.stringify(errors, null, 2));
        process.exit(1);
      }
      process.exit(0);
    },
  })
  //upload image command
  .command({
    command: 'upload-image-public <pathToImage>',
    describe: 'uploads an image publicly and returns its URL. This uses your current AWS credentials',
    builder: (args: yargs.Argv<unknown>) => {
      return args
        .positional('pathToImage', {
          describe: 'path to the image',
          type: 'string',
          demandOption: true,
        })
        .option('bucket', {
          describe: 'name of bucket to create',
          type: 'string',
          demandOption: false,
        });
    },
    handler: async (argv: UploadOptions): Promise<void> => {
      log.info(argv);
      const { imageUrl, imageName } = await uploadImagePublicly(log, argv.pathToImage, {
        bucketName: argv.bucket,
      });
      log.info(`URL to image '${imageName}': ${imageUrl} \n The URL might take a few minutes to be available.`);
      process.exit(0);
    },
  })
  .usage('usage: $0 [command] [options]')
  .demandCommand(1).argv;
