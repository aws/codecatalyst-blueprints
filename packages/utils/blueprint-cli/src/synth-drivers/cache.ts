import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as pino from 'pino';
import { writeResynthDriver } from '../resynth-drivers/driver';
import { writeSynthDriver } from './driver';

export interface CacheResult {
  synthDriver: string;
  resynthDriver: string;
}
export const createCache = (
  log: pino.BaseLogger,
  params: {
    buildDirectory: string;
    builtEntryPoint: string;
  },
) => {
  const synthCacheFile = 'synth-cache.production.js';
  const synthDriver = 'synth-driver.js';

  const resynthDriver = 'resynth-driver.js';
  const resynthCacheFile = 'resynth-cache.production.js';

  // cleanup non-build files from previous runs that may or may not exist
  const cleanup = [
    'node_modules',
    'node_modules.tar',
    'package.json',
    'package-lock.json',
    synthCacheFile,
    synthDriver,
    resynthDriver,
    resynthCacheFile,
  ];
  cleanup.forEach(file => {
    if (fs.existsSync(path.join(params.buildDirectory, file))) {
      cp.execSync(`rm -rf ${file}`, {
        stdio: 'inherit',
        cwd: params.buildDirectory,
      });
    }
  });

  writeSynthDriver(path.join(params.buildDirectory, synthDriver), params.builtEntryPoint, {
    packageJsonLocation: '../package.json',
  });

  writeResynthDriver(path.join(params.buildDirectory, resynthDriver), params.builtEntryPoint, {
    packageJsonLocation: '../package.json',
  });

  packageDependencies(log, { buildDirectory: params.buildDirectory });
  createWebpackedBundle(log, {
    buildDirectory: params.buildDirectory,
    exitFile: synthCacheFile,
    entryFile: synthDriver,
  });
  createWebpackedBundle(log, {
    buildDirectory: params.buildDirectory,
    exitFile: resynthCacheFile,
    entryFile: resynthDriver,
  });

  // clean up the synth driver
  cp.execSync(`rm ${synthDriver}`, {
    stdio: 'inherit',
    cwd: params.buildDirectory,
  });

  // clean up the resynth driver
  cp.execSync(`rm ${resynthDriver}`, {
    stdio: 'inherit',
    cwd: params.buildDirectory,
  });

  return {
    synthDriver: path.join(params.buildDirectory, synthCacheFile),
    resynthDriver: path.join(params.buildDirectory, resynthCacheFile),
  };
};

const packageDependencies = (
  log: pino.BaseLogger,
  params: {
    buildDirectory: string;
  },
) => {
  // This is a a hack until projen can be properly webpacked
  // ==========================================================================
  // Since projen is external we npm install it and ship with that.
  const projenVersion = findProjenVersion(
    {
      nodeModulesPath: path.join(params.buildDirectory, '..', 'node_modules'),
    },
    log,
  );

  const packageJson = {
    dependencies: {
      projen: projenVersion,
    },
  };

  const projenInstall = `echo '${JSON.stringify(packageJson, null, 2)}' > package.json` + ` && npm install projen@${projenVersion}`;
  console.log(projenInstall);
  cp.execSync(projenInstall, {
    stdio: 'inherit',
    cwd: params.buildDirectory,
  });

  // we need to package up the node_modules
  log.debug('Packaging node_modules');
  cp.execSync('tar -czf node_modules.tar  ./node_modules/', {
    cwd: params.buildDirectory,
  });
};

const createWebpackedBundle = (
  log: pino.BaseLogger,
  params: {
    buildDirectory: string;
    exitFile: string;
    entryFile: string;
  },
) => {
  //webpack the blueprint
  const webpackCommand =
    `npx webpack --entry ./${params.entryFile}` +
    ' --target node' +
    ' --output-path ./' +
    ` --output-filename ${params.exitFile}` +
    ' --progress' +
    ' --mode development' +
    ' --externals projen';

  log.debug('Webpacking with: %s', webpackCommand);

  cp.execSync(webpackCommand, {
    stdio: 'inherit',
    cwd: params.buildDirectory,
  });

  // This is a a hack until projen can be properly webpacked
  // ==========================================================================
  // Since projen is external we npm install it and ship with that.
  // Set correct reference to projen set it inside the cache
  const exitFilePath = path.join(params.buildDirectory, params.exitFile);
  let data = fs.readFileSync(exitFilePath, 'utf8');
  const replace = 'module.exports = projen;';
  data = data.replace(replace, `const projen = require('projen'); ${replace}`);
  fs.writeFileSync(exitFilePath, data, 'utf8');
};

const findProjenVersion = (
  options: {
    nodeModulesPath: string;
  },
  log: pino.BaseLogger,
) => {
  const projenPackageJson = path.join(options.nodeModulesPath, 'projen', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(projenPackageJson, 'utf8'));

  if (packageJson.version) {
    log.debug(
      `Found projen, looks like you're using version: ${packageJson.version} in your node modules. Using '${packageJson.version}' to build the cache.`,
    );
    return packageJson.version;
  }
  log.debug("Can't find a projen version. Using '*' to build the cache.");
  return '*';
};
