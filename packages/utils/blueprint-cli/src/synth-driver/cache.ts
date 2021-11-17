import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as pino from 'pino';
import { writeSynthDiver } from './driver';

export const createCache = (params: {
  buildDirectory: string;
  builtEntryPoint: string;
}, log: pino.BaseLogger) => {
  const cacheFile = 'synth-cache.production.js';
  const synthDriver = 'synth-driver.js';

  // write the synth driver
  writeSynthDiver(
    path.join(params.buildDirectory, synthDriver),
    params.builtEntryPoint,
  );

  createWebpackedBundle({
    buildDirectory: params.buildDirectory,
    exitFile: cacheFile,
    entryFile: synthDriver,
  }, log);

  // clean up the synth driver
  // cp.execSync(`rm ${synthDriver}`);

  return path.join(params.buildDirectory, cacheFile);
};

const createWebpackedBundle = (params: {
  buildDirectory: string;
  exitFile: string;
  entryFile: string;
}, log: pino.BaseLogger) => {

  //webpack the blueprint
  const webpackCommand = `npx webpack --entry ./${params.entryFile}`+
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
  const projenVersion = '*'; // TODO: get the projen version from package.json
  const nodeCache = 'node_cache';

  const projenInstall = 'echo {} > package.json' +
  ` && npm install projen@${projenVersion}` +
  ` && mv node_modules ${nodeCache}`;
  ' && rm package.json';
  ' && rm package-lock.json';

  console.log(projenInstall);
  cp.execSync(projenInstall, {
    stdio: 'inherit',
    cwd: params.buildDirectory,
  });

  // Set correct reference to projen set it inside the cache
  const exitFilePath = path.join(params.buildDirectory, params.exitFile);
  let data = fs.readFileSync(exitFilePath, 'utf8');
  const replace = 'module.exports = projen;';
  data = data.replace(replace, `const projen = require('./${nodeCache}/projen'); ${replace}`);
  fs.writeFileSync(exitFilePath, data, 'utf8');
};
