import * as fs from 'fs';
import pino from 'pino';
import { BlueprintTarget } from './generate-assessment';

export const deriveBlueprintTarget = (
  log: pino.BaseLogger,
  configuration: {
    spaceName?: string;
    blueprintName?: string;
    blueprintVersion?: string;
  },
  fallBackPackageJson: string,
): BlueprintTarget => {
  if (!configuration.spaceName || !configuration.blueprintName || !configuration.blueprintVersion) {
    // attempt to source this information from information in the package.json
    log.info(`Missing blueprint target information, attempting to derive it from ${fallBackPackageJson}`, configuration);
    const packageJson = JSON.parse(fs.readFileSync(fallBackPackageJson).toString());
    const target = {
      space: configuration.spaceName || packageJson.publishingSpace,
      package: configuration.blueprintName || packageJson.name,
      version: configuration.blueprintVersion || packageJson.version,
    };
    log.info('Now targetting...');
    log.info(target);
    return target;
  }

  return {
    space: configuration.spaceName!,
    package: configuration.blueprintName!,
    version: configuration.blueprintVersion!,
  };
};
