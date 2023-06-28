import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as pino from 'pino';
import yargs from 'yargs';
import { RESYNTH_TS_NAME, writeResynthDriver } from './driver';
import { DriverFile, synthesize } from '../synth-drivers/synth';
import { cleanUpDriver } from '../synth-drivers/synth-driver';

export interface ResynthesizeCliOptions extends yargs.Arguments {
  blueprint: string;
  outdir: string;
  options: string;
  priorBlueprint?: string;
  priorOptions?: string;
  existingBundle?: string;
  cache?: boolean;
  cleanUp: boolean;
}

interface ResynthesizeOptions {
  jobname: string;
  blueprint: string;
  priorBlueprint: string;
  outdir: string;
  existingBundleLocation: string;
  resynthDriver?: DriverFile;
  synthDriver?: DriverFile;
  options: any;
  priorOptions: any;
  cleanUp: boolean;
}

/**
 * executes a resynthesis
 * Resynthesis runs synthesis twice.
 *  Once for the proposed project,
 *  Once for the ancestor, once for the proposed files,
 * and then it runs a resolution with the existing codebase
 * @param log
 * @param options
 */
export function resynthesize(log: pino.BaseLogger, options: ResynthesizeOptions): void {
  // todo validate input

  const { ancestorLocation, proposedLocation, existingLocation, resolvedLocation } = setupResynthesisOutputDirectory(log, options.outdir, {
    existingBundle: options.existingBundleLocation,
  });

  // synthesize ancestor files
  synthesize(log, {
    blueprintPath: options.priorBlueprint,
    blueprintOptions: options.priorOptions,
    jobname: `${options.jobname}-${ancestorLocation}`,
    outputDirectory: ancestorLocation,
    synthDriver: options.synthDriver,
    existingBundle: existingLocation,
    cleanUp: options.cleanUp,
  });

  // synthesize proposed files
  synthesize(log, {
    blueprintPath: options.blueprint,
    blueprintOptions: options.options,
    jobname: `${options.jobname}-${proposedLocation}`,
    outputDirectory: proposedLocation,
    synthDriver: options.synthDriver,
    existingBundle: existingLocation,
    cleanUp: options.cleanUp,
  });

  // if theres nothing at the existing files, copy-the ancestor files into there too.
  if (fs.readdirSync(existingLocation).length == 0) {
    log.warn('===============================');
    log.warn(`Nothing found in ${existingLocation}, seeding it with ancestor files as a default`);
    log.warn('===============================');
    copyFolderSync(log, ancestorLocation, existingLocation);
  }

  // build the resythesis driver
  const resynthDriver: DriverFile = makeResynthDriverFile(log, {
    blueprintLocation: options.blueprint,
    resynthDriver: options.resynthDriver,
  });

  log.debug(`Using resynth driver: ${resynthDriver.path}`);
  try {
    // if something already exists at the output location, we remove it.
    log.debug('cleaning up existing code at resynth resolved output location: %s', resolvedLocation);
    const cleanCommand = `rm -rf ${resolvedLocation}`;
    cp.execSync(cleanCommand, {
      stdio: 'inherit',
      cwd: options.blueprint,
    });

    const timeStart = Date.now();
    executeResynthesisCommand(log, options.blueprint, options.jobname, {
      driver: resynthDriver,
      options: options.options,
      entropy: String(Math.floor(Date.now() / 100)),
      ancestorBundleDirectory: ancestorLocation,
      existingBundleDirectory: existingLocation,
      proposedBundleDirectory: proposedLocation,
      outputDirectory: resolvedLocation,
    });
    const timeEnd = Date.now();

    log.debug(`Resynth Time: [${timeEnd - timeStart} ms]`);
  } catch (e) {
    throw e;
  } finally {
    // if I wrote the resynth driver, then also clean it up.
    if (!options.resynthDriver && options.cleanUp) {
      cleanUpDriver(log, resynthDriver);
    }
  }
}

interface ResynthesisFileStructure {
  /**
   * The location of the ancestor bundle in the three way merge
   */
  ancestorLocation: string;

  /**
   * The location of the latest proposed code
   */
  proposedLocation: string;

  /**
   * The location of the existing bundle
   */
  existingLocation: string;

  /**
   * The location of the resolved bundle
   */
  resolvedLocation: string;
}
export const ANCESTOR_BUNDLE_SUBPATH = 'ancestor-bundle';
export const PROPOSED_BUNDLE_SUBPATH = 'proposed-bundle';
export const EXISTING_BUNDLE_SUBPATH = 'existing-bundle';
export const RESOLVED_BUNDLE_SUBPATH = 'resolved-bundle';
const setupResynthesisOutputDirectory = (
  log: pino.BaseLogger,
  outputDirectory: string,
  options: {
    existingBundle: string;
  },
): ResynthesisFileStructure => {
  const ancestorFilesLocation = path.join(outputDirectory, ANCESTOR_BUNDLE_SUBPATH);
  const proposedFilesLocation = path.join(outputDirectory, PROPOSED_BUNDLE_SUBPATH);
  const existingFilesLocation = path.join(outputDirectory, EXISTING_BUNDLE_SUBPATH);

  log.debug({
    ancestorFilesLocation,
    proposedFilesLocation,
    existingFilesLocation,
  });

  // save the existing code
  if (options.existingBundle != existingFilesLocation) {
    removeFolders(log, [existingFilesLocation]);
    copyFolderSync(log, options.existingBundle, existingFilesLocation);
  }

  // clean the rest of the output locations
  const resolvedFilesLocation = path.join(outputDirectory, RESOLVED_BUNDLE_SUBPATH);
  removeFolders(log, [ancestorFilesLocation, proposedFilesLocation, resolvedFilesLocation]);
  createFolders(log, [ancestorFilesLocation, proposedFilesLocation, resolvedFilesLocation, existingFilesLocation]);

  return {
    ancestorLocation: ancestorFilesLocation,
    proposedLocation: proposedFilesLocation,
    existingLocation: existingFilesLocation,
    resolvedLocation: resolvedFilesLocation,
  };
};

const executeResynthesisCommand = (
  logger: pino.BaseLogger,
  cwd: string,
  jobname: string,
  options: {
    driver: DriverFile;
    options: any;
    entropy: string;
    ancestorBundleDirectory: string;
    existingBundleDirectory: string;
    proposedBundleDirectory: string;
    outputDirectory: string;
  },
) => {
  cp.execSync(`mkdir -p ${options.outputDirectory}`, {
    stdio: 'inherit',
    cwd,
  });

  const command = [
    `npx ${options.driver.runtime}`,
    `${options.driver.path}`,
    `'${JSON.stringify(options.options)}'`,
    `${options.outputDirectory}`,
    `${options.entropy}`,
    `${options.ancestorBundleDirectory}`,
    `${options.existingBundleDirectory}`,
    `${options.proposedBundleDirectory}`,
  ].join(' ');

  logger.debug(`[${jobname}] reynthesis Command: ${command}`);
  cp.execSync(command, {
    stdio: 'inherit',
    cwd,
    env: {
      EXISTING_BUNDLE_ABS: path.resolve(options.existingBundleDirectory),
      ...process.env,
    },
  });
};

const copyFolderSync = (log: pino.BaseLogger, source: string, target: string) => {
  // Check if folder needs to be created or integrated
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  if (!fs.existsSync(source)) {
    return;
  }

  if (fs.lstatSync(source).isDirectory()) {
    fs.readdirSync(source).forEach(file => {
      const curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderSync(log, curSource, path.join(target, path.basename(curSource)));
      } else {
        fs.copyFileSync(curSource, path.join(target, path.basename(curSource)));
      }
    });
  }
};

const removeFolders = (_log: pino.BaseLogger, folders: string[]) => {
  folders.forEach(folder => {
    if (fs.existsSync(folder)) {
      fs.rmSync(folder, {
        recursive: true,
        force: true,
      });
    }
  });
};

const createFolders = (_log: pino.BaseLogger, folders: string[]) => {
  folders.forEach(folder => {
    if (!fs.existsSync(folder)) {
      _log.debug(`creating at ${folder}`);
      fs.mkdirSync(folder, {
        recursive: true,
      });
    }
  });
};

const makeResynthDriverFile = (
  _log: pino.BaseLogger,
  options: {
    blueprintLocation: string;
    resynthDriver?: DriverFile;
  },
): DriverFile => {
  if (options.resynthDriver) {
    return options.resynthDriver;
  }

  return {
    path: writeResynthDriver(path.join(options.blueprintLocation, RESYNTH_TS_NAME), path.join(options.blueprintLocation, 'src', 'index.ts')),
    runtime: 'ts-node',
  };
};
