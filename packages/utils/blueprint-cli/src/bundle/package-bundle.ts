import * as cp from 'child_process';
import path from 'path';
import * as pino from 'pino';

/**
 * EXPERIMENTAL. This relies on 'zip' being available locally.
 */
export function packageBundle(
  logger: pino.BaseLogger,
  folderPathAbs: string,
  outputPathAbs: string,
  options: {
    encrypt?: boolean;
  },
) {
  try {
    const zipArgs = [path.basename(outputPathAbs), '-r', path.basename(folderPathAbs), '-x', '**/.git/**'];
    if (options.encrypt) {
      logger.info('Packing folder. Enter zip password ...');
      zipArgs.push('-e');
    }
    logger.debug(`zip ${zipArgs.join(' ')}`);
    cp.execFileSync('zip', zipArgs, {
      stdio: 'inherit',
      cwd: path.dirname(folderPathAbs),
    });
  } catch (e: any) {
    logger.warn(e);
    logger.warn('Zip Failed. Do you have the zip cli installed?');
  }
}
