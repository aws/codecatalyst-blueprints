#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as pino from 'pino';
import * as yargs from 'yargs';

import { hideBin } from 'yargs/helpers';
import { GenerateAssessmentCLIOptions, generateAssessmentCLI } from './assessment/generate-assessment-cli';
import { ValidateAssessmentCLIOptions, validateAssessment } from './assessment/validate-assessment';
import { AstOptions, buildAst } from './build-ast';
import { UploadOptions, uploadImagePublicly } from './image-upload-tool/upload-image-to-aws';
import { PublishOptions, publish } from './publish/publish';
import { EXISTING_BUNDLE_SUBPATH, ResynthesizeCliOptions, resynthesize } from './resynth-drivers/resynth';
import { ResynthDriverCliOptions, driveResynthesis } from './resynth-drivers/resynth-driver';
import { createCache } from './synth-drivers/cache';
import { synthesize, SynthesizeCliOptions, DriverFile } from './synth-drivers/synth';
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
        .option('clean-up', {
          description: 'clean up synthesis drivers',
          default: true,
          type: 'boolean',
        })
        .option('cache', {
          description: 'Generate and synth from a webpacked cache',
          type: 'boolean',
          default: false,
        });
    },
    handler: async (argv: SynthesizeCliOptions): Promise<void> => {
      argv = useOverrideOptionals(argv);
      let driverFile: DriverFile | undefined;

      if (argv.cache) {
        const { synthDriver } = await createCache(log, {
          buildDirectory: path.join(argv.blueprint, 'lib'),
          builtEntryPoint: './index.js',
        });
        driverFile = {
          runtime: 'node',
          path: synthDriver,
        };
        log.debug(`creating cache with a driver file at ${driverFile.path}`);
      }

      void (await synthesize(log, {
        blueprintPath: argv.blueprint,
        blueprintOptions: JSON.parse(fs.readFileSync(argv.options, 'utf-8')),
        jobname: path.parse(argv.options).base,
        outputDirectory: argv.outdir,
        synthDriver: driverFile,
        existingBundle: argv.existingBundle || '',
        cleanUp: argv.cleanUp,
      }));
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
        .option('clean-up', {
          description: 'clean up synthesis drivers',
          default: true,
          type: 'boolean',
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
      argv = useOverrideOptionals(argv);
      if (argv.cache) {
        log.info('Building a production cache. Emulating the wizard');
      } else {
        log.info('Running in quick mode. Run this command with --cache to emulate the wizard');
      }

      void (await driveSynthesis(log, argv));
      process.exit(0);
    },
  })
  //resynth command
  .command({
    command: 'resynth',
    describe: 'locally resynthesize the blueprint, using the defaults.json any wizard configs (if they exist)',
    builder: (args: yargs.Argv<unknown>) => {
      return args
        .option('blueprint', {
          describe: 'path to the blueprint package directory',
          type: 'string',
          demandOption: true,
        })
        .option('outdir', {
          describe: 'output directory for blueprint resynthesis',
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
        })
        .option('prior-blueprint', {
          description: 'path the prior blueprint',
          type: 'string',
        })
        .option('prior-options', {
          description: 'path the prior options',
          type: 'string',
        })
        .option('clean-up', {
          description: 'clean up synthesis drivers',
          default: true,
          type: 'boolean',
        })
        .option('cache', {
          description: 'Generate and resynth from a webpacked cache',
          default: false,
          type: 'boolean',
        });
    },
    handler: async (argv: ResynthesizeCliOptions): Promise<void> => {
      argv = useOverrideOptionals(argv);

      let resynthDriverFile: DriverFile | undefined;
      let synthDriverFile: DriverFile | undefined;

      if (argv.cache) {
        const { resynthDriver, synthDriver } = await createCache(log, {
          buildDirectory: path.join(argv.blueprint, 'lib'),
          builtEntryPoint: './index.js',
        });
        resynthDriverFile = {
          runtime: 'node',
          path: resynthDriver,
        };
        synthDriverFile = {
          runtime: 'node',
          path: synthDriver,
        };
        log.debug(`Creating cache with a driver file at ${resynthDriverFile.path}`);
      }

      const optionsObject = JSON.parse(fs.readFileSync(argv.options, 'utf-8'));
      let priorOptionsObject = optionsObject;
      if (argv.priorOptions) {
        priorOptionsObject = JSON.parse(fs.readFileSync(argv.priorOptions, 'utf-8'));
      }

      void (await resynthesize(log, {
        blueprint: argv.blueprint,
        priorBlueprint: argv.priorBlueprint || argv.blueprint,
        outdir: argv.outdir,
        options: optionsObject,
        priorOptions: priorOptionsObject,
        existingBundleLocation: argv.existingBundle || '',
        jobname: path.parse(argv.options).base,
        resynthDriver: resynthDriverFile,
        synthDriver: synthDriverFile,
        cleanUp: argv.cleanUp,
      }));

      process.exit(0);
    },
  })
  //resynth driver command
  .command({
    command: 'drive-resynth',
    describe: `locally drive resynthesis across multiple wizard configs. Defaults to using the same blueprint and any existing projects with options under ${EXISTING_BUNDLE_SUBPATH}/. Resynthesis contructs a new synthesis bundle and then attempts to merge it with an exisiting bundle using a common ancestor.`,
    builder: (args: yargs.Argv<unknown>) => {
      return args
        .option('blueprint', {
          describe: 'path to the blueprint package directory',
          type: 'string',
          demandOption: true,
        })
        .option('outdir', {
          describe: 'output directory for blueprint resynthesis',
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
        .option('existing-bundle', {
          description: 'path to an existing bundle to use as blueprint context',
          type: 'string',
        })
        .option('prior-options', {
          description:
            'optional path to an json representing the options used for the ancestor codebase. This will be the prior options used for each wizard-option resynth.',
          type: 'string',
        })
        .option('clean-up', {
          description: 'clean up synthesis drivers',
          default: true,
          type: 'boolean',
        })
        .option('cache', {
          description: 'Generate and resynth from a webpacked cache',
          default: false,
          type: 'boolean',
        });
    },
    handler: async (argv: ResynthDriverCliOptions): Promise<void> => {
      argv = useOverrideOptionals(argv);
      if (argv.cache) {
        log.info('Building a production cache. Emulating the wizard');
      } else {
        log.info('Running in quick mode. Run this command with --cache to emulate the wizard');
      }

      void (await driveResynthesis(log, argv));
      process.exit(0);
    },
  })
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
          description: 'the name of the publishing space',
          demandOption: true,
          type: 'string',
        })
        .option('cookie', {
          description: 'the code catalyst cookie to use for authorization. Get this from webauth.',
          demandOption: false,
          type: 'string',
        })
        .option('endpoint', {
          description: 'the code catalyst endpoint to publish against',
          demandOption: false,
          type: 'string',
          default: 'public.console.codecatalyst.aws',
        })
        .option('region', {
          description: 'the code catalyst space region. Used for authentication. Defaults to $AWS_REGION and us-west-2',
          demandOption: false,
          type: 'string',
        })
        .option('force', {
          description:
            'Force publish. This will overwrite the existing blueprint version (if it exists). This may cause exisiting blueprint consumers unexpected difference sets.',
          demandOption: false,
        });
    },
    handler: async (argv: PublishOptions): Promise<void> => {
      argv = useOverrideOptionals(argv);
      console.log(argv);
      void (await publish(log, argv.endpoint, {
        blueprintPath: argv.blueprint,
        publishingSpace: argv.publisher,
        cookie: argv.cookie,
        region: argv.region || process.env.AWS_REGION || 'us-west-2',
        force: ((argv.force as boolean) && argv.force == true) || false,
      }));
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
      argv = useOverrideOptionals(argv);
      void (await buildAst(log, argv.blueprint, argv.outdir));
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
      argv = useOverrideOptionals(argv);
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
      argv = useOverrideOptionals(argv);
      log.info(argv);
      const { imageUrl, imageName } = await uploadImagePublicly(log, argv.pathToImage, {
        bucketName: argv.bucket,
      });
      log.info(`URL to image '${imageName}': ${imageUrl} \n The URL might take a few minutes to be available.`);
      process.exit(0);
    },
  })
  //generate-assessment
  .command({
    command: 'generate-assessment',
    describe: 'generates an assessment object from a wizard configuration',
    builder: (args: yargs.Argv<unknown>) => {
      return args
        .option('wizard-option', {
          describe: 'path to a wizard options',
          type: 'string',
          demandOption: true,
        })
        .option('version', {
          description:
            'which version of the blueprint should the assessment evaluate. This will override specification in the configuration (if it exists)',
          type: 'string',
          demandOption: false,
        })
        .option('configuration', {
          describe: 'path to optional configuration object used to override assessment options',
          type: 'string',
          demandOption: false,
        })
        .option('continuous', {
          describe: 'set to true if you want the assessment to be continually scheduled.',
          type: 'boolean',
          default: false,
          demandOption: false,
        })
        .option('package-json', {
          describe: 'path to package.json. Used for deriving the assessment target blueprint information',
          type: 'string',
          default: './package.json',
          demandOption: false,
        })
        .option('out', {
          describe: 'outputs the assessment at this location. Creates a file if it does not exist',
          type: 'string',
          demandOption: false,
        });
    },
    handler: async (argv: GenerateAssessmentCLIOptions): Promise<void> => {
      argv = useOverrideOptionals(argv);
      log.info(`Using --wizard-option ${argv.wizardOption}`);
      if (!argv.configuration) {
        log.warn('No --configuration is passed. No assessment overrides are being used');
      } else {
        log.info(`Using --configuration ${argv.configuration}`);
      }
      const { assessment, out } = generateAssessmentCLI(log, argv);

      log.info(`Writing assessment to ${out}`);
      if (!fs.existsSync(out)) {
        fs.mkdirSync(path.dirname(out), { recursive: true });
      }
      fs.writeFileSync(out, JSON.stringify(assessment, null, 2));
      process.exit(0);
    },
  })
  //validate-assessment
  .command({
    command: 'validate-assessment',
    describe: 'validates a full or partial assessment object',
    builder: (args: yargs.Argv<unknown>) => {
      return args
        .option('path', {
          describe: 'path to an assessment object',
          type: 'string',
          demandOption: true,
        })
        .option('full', {
          description: 'True if this is intended to be a fully qualified assessment object',
          type: 'boolean',
          default: false,
          demandOption: false,
        });
    },
    handler: async (argv: ValidateAssessmentCLIOptions): Promise<void> => {
      argv = useOverrideOptionals(argv);
      const assessmentJson = JSON.parse(fs.readFileSync(argv.path).toString());
      const { validationResult, reasons } = validateAssessment(assessmentJson, {
        fullSchema: argv.full,
      });
      if (validationResult) {
        log.info(`[Success] Assessment at ${argv.path} is passes schema validation. See BlueprintAssessmentObject`);
      } else {
        log.error(`[Failure] Assessment at ${argv.path} does NOT pass schema validation. See BlueprintAssessmentObject`);
        log.error(JSON.stringify(reasons, null, 2));
      }
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
