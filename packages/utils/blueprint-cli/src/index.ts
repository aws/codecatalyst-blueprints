#!/usr/bin/env node

import * as pino from 'pino';
import * as yargs from 'yargs';

import { hideBin } from 'yargs/helpers';
import { ConvertOptions, convertToAssessmentObjects } from './assessment-converter/assessment-converter';
import { AstOptions, buildAst } from './build-ast';
import { UploadOptions, uploadImagePublicly } from './image-upload-tool/upload-image-to-aws';
import { PublishOptions, publish } from './publish';
import { SynthesizeOptions, synth } from './synth-driver/synth';
import { doOptionValidation } from './validate-options';

const log = pino.default({
  prettyPrint: true,
  level: process.env.LOG_LEVEL || 'debug',
});

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
        .option('outdirExact', {
          default: false,
          describe: 'use given `outdir` exactly, without adding entropy and without using a stable directory',
          type: 'boolean',
        })
        .option('enableStableSynthesis', {
          default: true,
          describe: 'in addition to regular synthesis, synthesize in a stable directory using a stable cache',
          type: 'boolean',
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
      await synth(log, argv);
      process.exit(0);
    },
  })
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
  .command({
    command: 'convert-to-assessment',
    describe: 'converts wizard options and user-defined configurations to assessment objects',
    builder: (args: yargs.Argv<unknown>) => {
      return args
        .option('wizard-options-folder-path', {
          describe: "path to wizard options folder, this is default to 'src/snapshot-configurations' folder",
          type: 'string',
          default: './src/snapshot-configurations',
          demandOption: false,
        })
        .option('configurations-file-path', {
          describe: 'path to user-defined assessment configurations file, this is used to configure the assessment object',
          type: 'string',
          demandOption: false,
        })
        .option('continuous', {
          describe: 'if schedule type is continuous',
          type: 'boolean',
          default: false,
          demandOption: false,
        })
        .option('useLatest', {
          description: 'use the latest blueprint version specified in package.json',
          type: 'boolean',
          default: false,
          demandOption: false,
        });
    },
    handler: async (argv: ConvertOptions): Promise<void> => {
      log.info(argv);
      const rootDirectory = process.cwd();
      const outputDirectoryFromRoot = '/src/assessment-objects';
      const assessmentObjectsFolderPath = convertToAssessmentObjects(
        log,
        rootDirectory,
        outputDirectoryFromRoot,
        argv.continuous,
        argv.useLatest,
        argv.wizardOptionsFolderPath,
        argv.configurationsFilePath,
      );
      log.info(`Blueprint assessment objects created, path to folder of objects: '${assessmentObjectsFolderPath}'.`);
      process.exit(0);
    },
  })
  .usage('usage: $0 [command] [options]')
  .demandCommand(1).argv;
