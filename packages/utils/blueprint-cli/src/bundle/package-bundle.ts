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
    let zipCommand = [`zip ${path.basename(outputPathAbs)}`, `-r ${path.basename(folderPathAbs)}`, '-x **/.git/**'].join(' ');
    logger.debug(zipCommand);
    if (options.encrypt) {
      logger.info('Packing folder. Enter zip password ...');
      zipCommand = `${zipCommand} -e`;
    }
    cp.execSync(zipCommand, {
      stdio: 'inherit',
      cwd: path.dirname(folderPathAbs),
    });
  } catch (e: any) {
    logger.warn(e);
    logger.warn('Zip Failed. Do you have the zip cli installed?');
  }
}
