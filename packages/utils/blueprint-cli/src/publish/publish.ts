import * as fs from 'fs';
import * as path from 'path';
import * as pino from 'pino';
import * as yargs from 'yargs';
import { codecatalystAuthentication } from './codecatalyst-authentication';
import { uploadBlueprint } from './upload-blueprint';
import { IdentityResponse, verifyIdentity } from './verify-identity';

export interface PublishOptions extends yargs.Arguments {
  blueprint: string;
  publisher: string;
  cookie?: string;
  endpoint: string;
  region?: string;
}

export async function publish(
  log: pino.BaseLogger,
  endpoint: string,
  options: {
    blueprintPath: string;
    publishingSpace: string;
    cookie?: string;
    region: string;
    force?: boolean;
  },
): Promise<void> {
  if (!fs.existsSync(options.blueprintPath)) {
    log.error('blueprint directory does not exist: %s', options.blueprintPath);
    process.exit(255);
  }

  const packageJsonPath = path.join(options.blueprintPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log.error('blueprint path does not contain a `package.json`, expected: %s', packageJsonPath);
    process.exit(255);
  }

  const authentication = await codecatalystAuthentication(log, {
    cookie: options.cookie ?? process.env.CAWS_COOKIE,
    endpoint,
    region: options.region,
  });

  let identity: IdentityResponse;
  if (authentication) {
    log.info('Verifying identity...');
    identity = await verifyIdentity(endpoint, { authentication });
    log.info(`Publishing as ${identity.name} at ${identity.email}`);
    log.info('Against endpoint: %s', endpoint);
  } else {
    log.error('Could not authenticate');
    process.exit(255);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const packageName: string = packageJson.name;
  const version = packageJson.version;

  const distributionFolder = path.join(options.blueprintPath, 'dist', 'js');
  if (!fs.existsSync(distributionFolder)) {
    log.error('package has not yet been published locally, have you run blueprint:synth? expected: %s', distributionFolder);
    process.exit(198);
  }

  const packagePath = fs
    .readdirSync(distributionFolder, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.tgz'))
    .map(entry => entry.name)[0];

  const fullPackagePath = path.join(distributionFolder, packagePath);
  if (!packagePath) {
    log.error(
      'package has not yet been published locally, have you run blueprint:synth? expected something at: %s/*.tgz or ' + fullPackagePath,
      distributionFolder,
      version,
    );
    process.exit(199);
  }

  await uploadBlueprint(log, fullPackagePath, endpoint, {
    force: options.force,
    blueprint: {
      publishingSpace: options.publishingSpace,
      targetSpace: options.publishingSpace,
      packageName,
      version,
      authentication,
      identity,
    },
  });
}
