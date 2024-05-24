import * as fs from 'fs';
import * as path from 'path';
import * as pino from 'pino';
import * as yargs from 'yargs';
import { codecatalystAuthentication } from './codecatalyst-authentication';
import { uploadBlueprint } from './upload-blueprint';
import { IdentityResponse, verifyIdentity } from './verify-identity';

export interface PublishOptions extends yargs.Arguments {
  blueprint: string;
  space: string;
  cookie?: string;
  endpoint: string;
  region?: string;
  project?: string;
  instance?: string;
}

export async function publish(
  log: pino.BaseLogger,
  endpoint: string,
  options: {
    blueprintPath: string;
    publishingSpace: string;
    targetProject?: string;
    targetInstance?: string;
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

  let identity: IdentityResponse | undefined;
  if (authentication) {
    if (authentication.type != 'workflowtoken') {
      log.info('Verifying identity...');
      identity = await verifyIdentity(endpoint, { authentication });
      log.info(`Publishing as ${identity.name} at ${identity.email}`);
      log.info('Against endpoint: %s', endpoint);
    }
  } else {
    log.error('Could not authenticate');
    process.exit(255);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const packageName: string = packageJson.name;
  if (!packageName.match(/^(?:@(?:[a-z0-9-*~][a-z0-9-*._~]*)?\/)?[a-z0-9-~][a-z0-9-._~]*$/) || packageName.length > 214) {
    log.error(
      `Package ['${packageName}'] not match NPM regex \`^(?:@(?:[a-z0-9-*~][a-z0-9-*._~]*)?\/)?[a-z0-9-~][a-z0-9-._~]*$\` or is not less than 214 characters.`,
    );
    process.exit(255);
  }

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
      targetProject: options.targetProject,
      targetInstance: options.targetInstance,
      packageName,
      version,
      authentication,
      identity,
    },
  });
}
