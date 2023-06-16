import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as pino from 'pino';
import yargs from 'yargs';
import { DriverFile, synthesize } from '../synth-drivers/synth';
import { RESYNTH_TS_NAME, writeResynthDriver } from './driver';

export interface ResynthesizeCliOptions extends yargs.Arguments {
  blueprint: string;
  outdir: string;
  options: string;
  priorBlueprint?: string;
  priorOptions?: string;
  existingBundle?: string;
  cache?: boolean;
}

interface ResynthesizeOptions {
  jobname: string;
  blueprint: string;
  priorBlueprint: string;
  outdir: string;
  optionsLocation: string;
  priorOptionsLocation: string;
  existingBundleLocation: string;
  resynthDriver?: DriverFile;
  synthDriver?: DriverFile;
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
export async function resynthesize(log: pino.BaseLogger, options: ResynthesizeOptions): Promise<void> {
  // todo validate input

  const { ancestorLocation, proposedLocation, existingLocation, resolvedLocation } = setupResynthesisOutputDirectory(log, options.outdir, {
    existingBundle: options.existingBundleLocation,
    entropy: '00',
  });

  // synthesize ancestor files
  synthesize(log, {
    blueprintPath: options.priorBlueprint,
    blueprintOptions: JSON.parse(fs.readFileSync(options.priorOptionsLocation, 'utf-8')),
    jobname: `${path.parse(options.priorOptionsLocation).base}-${ancestorLocation}`,
    outputDirectory: ancestorLocation,
    synthDriver: options.synthDriver,
    existingBundle: existingLocation,
  });

  // synthesize proposed files
  synthesize(log, {
    blueprintPath: options.blueprint,
    blueprintOptions: JSON.parse(fs.readFileSync(options.optionsLocation, 'utf-8')),
    jobname: `${path.parse(options.optionsLocation).base}-${proposedLocation}`,
    outputDirectory: proposedLocation,
    synthDriver: options.synthDriver,
    existingBundle: existingLocation,
  });

  // if theres nothing at the existing files, copy-the ancestor files into there too.
  if (fs.readdirSync(existingLocation).length == 0) {
    log.warn(`Nothing found in ${existingLocation}, seeding it with ancestor files as a default`);
    copyFolderSync(log, ancestorLocation, existingLocation);
  }

  // build the resythesis driver
  const resynthDriver: DriverFile = makeResynthDriverFile(log, options);

  log.debug(`Using driver: ${resynthDriver.path}`);
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
    if (!options.resynthDriver) {
      log.debug('Cleaning up resynth driver: %s', resynthDriver.path);
      cp.execSync(`rm ${resynthDriver.path}`, {
        stdio: 'inherit',
        cwd: options.blueprint,
      });
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
const setupResynthesisOutputDirectory = (
  log: pino.BaseLogger,
  outputDirectory: string,
  options: {
    existingBundle: string;
    entropy: string;
  },
): ResynthesisFileStructure => {
  const ancestorFilesLocation = path.join(outputDirectory, `ancestor-${options.entropy}`);
  const proposedFilesLocation = path.join(outputDirectory, `proposed-${options.entropy}`);
  const existingFilesLocation = path.join(outputDirectory, `existing-${options.entropy}`);

  log.debug({
    ancestorFilesLocation,
    proposedFilesLocation,
    existingFilesLocation,
  });

  // save the existing code
  removeFolders(log, [existingFilesLocation]);
  copyFolderSync(log, options.existingBundle, existingFilesLocation);

  // clean the rest of the output locations
  const resolvedFilesLocation = path.join(outputDirectory, `resolved-${options.entropy}`);
  removeFolders(log, [ancestorFilesLocation, proposedFilesLocation, resolvedFilesLocation]);

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
    `${options.ancestorBundleDirectory}`,
    `${options.existingBundleDirectory}`,
    `${options.proposedBundleDirectory}`,
    `${options.outputDirectory}`,
  ].join(' ');

  logger.debug(`[${jobname}] reynthesis Command: ${command}`);
  cp.execSync(command, {
    stdio: 'inherit',
    cwd,
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
      log.debug(curSource);
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

const makeResynthDriverFile = (_log: pino.BaseLogger, options: ResynthesizeOptions): DriverFile => {
  if (options.synthDriver) {
    return options.synthDriver;
  }

  return {
    path: writeResynthDriver(path.join(options.blueprint, RESYNTH_TS_NAME), path.join(options.blueprint, 'src', 'index.ts')),
    runtime: 'ts-node',
  };
};
