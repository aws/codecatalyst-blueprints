import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as esbuild from 'esbuild';
import * as pino from 'pino';
import { writeSynthDriver } from './driver';
import { writeResynthDriver } from '../resynth-drivers/driver';

const nodeModulesRegex = new RegExp(/^(?:.*[\\\/])?node_modules(?:[\\\/].*)?$/);

/**
 * Traverse up the directory tree, returning the first directory that contains a package.json.
 *
 * @param dir dirname to start the search.
 * @returns nearest directory containing a package.json.
 */
const findParentPackageDir = (dir: string) => {
  if (fs.existsSync(`${dir}/package.json`)) {
    return dir;
  } else {
    return findParentPackageDir(`${dir}/..`);
  }
};

/**
 * A custom ESBuild plugin which re-links any instances of __dirname and __filename to a new 'externals' folder within lib.
 *
 * This is needed as when bundling, static assets referenced by __dirname and __filename are not present within the runtime closure
 * and as such will not be present in the bundle. To remedy this, if any file within the 'node_modules' directory contains a reference
 * to either __dirname or __filename, we copy all of its files (excluding it's own node_modules) into a lib/externals/<package> folder
 * and rewrite the __dirname reference to point to this new relative path.
 *
 * For example, lets say we have a file in projen called `lib/license.js` which refers to a file via `${__dirname}/../license-text/MIT.txt`.
 * The first thing we do is copy the projen files into lib/externals/projen. For the purpose of this example, the focused file structure will be
 * as follows:
 *
 * /lib
 *   /externals
 *     /projen
 *       /license-text
 *         MIT.txt
 *       /lib
 *         license.js
 *   synth-cache.production.js (bundle location)
 *
 * The plugin will re-write the original reference `${__dirname}/../license-text/MIT.txt` into `${__dirname}/lib/externals/projen/lib/../license-text/MIT.txt`.
 * This now will resolve to a correct path on the filesystem.
 *
 * Note: This is a more performant and simpler solution than using something like `externals` as that requires explicitly listing each dependency to exclude
 * from the bundle whilst also pulling in uncessary dependencies (and losing esbuild's tree shaking capability) into a node_modules.tar.
 */
const fsLinkerPlugin = {
  name: 'fs_linker',
  setup(build: any) {
    build.onStart(() => {
      cp.execSync('rm -rf ./lib/externals');
    });

    build.onLoad({ filter: /\.(t|j)s/ }, ({ path: filePath }) => {
      if (filePath.match(nodeModulesRegex)) {
        const pathSegments = filePath.split('node_modules/');
        let segments = pathSegments[pathSegments.length - 1].split('/');
        const dirname = segments.slice(0, segments.length - 1).join('/');
        let filename = segments.join('/');
        const originalContents = fs.readFileSync(filePath, 'utf8');
        const loader = path.extname(filePath).substring(1);

        const contents = originalContents
          .replace(/__dirname/g, `__dirname + "/externals/${dirname}"`)
          .replace(/__filename/g, `__dirname + "/externals/${filename}"`);

        if (contents !== originalContents && !fs.existsSync(`lib/externals/${dirname}`)) {
          const filesSegments = filePath.split('/');
          const rootPkg = findParentPackageDir(filesSegments.slice(0, filesSegments.length - 1).join('/'));
          const pkgName = JSON.parse(fs.readFileSync(`${rootPkg}/package.json`, { encoding: 'utf-8' })).name;
          cp.execSync(
            `mkdir -p ./lib/externals/${pkgName} && rsync -a ${rootPkg} ./lib/externals/${pkgName} --include="*/" --exclude="node_modules/**" --prune-empty-dirs`,
          );
        }
        return {
          contents,
          loader,
        };
      }
      return;
    });
  },
};

export interface CacheResult {
  synthDriver: string;
  resynthDriver: string;
}
export const createCache = async (
  log: pino.BaseLogger,
  params: {
    buildDirectory: string;
    builtEntryPoint: string;
  },
): Promise<{ synthDriver: string; resynthDriver: string }> => {
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
  log.debug('Creating synthesis cache');
  void (await createBundle(log, {
    buildDirectory: params.buildDirectory,
    exitFile: synthCacheFile,
    entryFile: synthDriver,
  }));
  log.debug('Creating resynthesis cache');
  void (await createBundle(log, {
    buildDirectory: params.buildDirectory,
    exitFile: resynthCacheFile,
    entryFile: resynthDriver,
  }));

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

// TODO: Remove this once we remove the unpacking code from the server as it is no longer needed
const packageDependencies = (
  log: pino.BaseLogger,
  params: {
    buildDirectory: string;
  },
) => {
  // we need to package up the node_modules
  log.debug('Packaging node_modules');
  cp.execSync('mkdir -p ./node_modules && tar -czf node_modules.tar ./node_modules/ && rm -rf ./node_modules', {
    cwd: params.buildDirectory,
  });
};

const createBundle = async (
  log: pino.BaseLogger,
  params: {
    buildDirectory: string;
    exitFile: string;
    entryFile: string;
  },
) => {
  log.debug('Creating bundle');

  const bundle = await esbuild.build({
    entryPoints: [`${params.buildDirectory}/${params.entryFile}`],
    bundle: true,
    outfile: `${params.buildDirectory}/${params.exitFile}`,
    platform: 'node',
    plugins: [fsLinkerPlugin],
    logLevel: 'error',
  });

  log.debug(`Bundle created with ${bundle.errors.length} errors & ${bundle.warnings.length} warnings.`);
};
