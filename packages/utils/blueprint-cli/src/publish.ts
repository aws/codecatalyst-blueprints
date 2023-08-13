import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as stream from 'stream';
import * as util from 'util';
import { SSOServiceException } from '@aws-sdk/client-sso';
import * as axios from 'axios';
import * as pino from 'pino';
import * as yargs from 'yargs';
import { codecatalystVerifyIdentity } from './codecatalyst-client';
import { verifyIdentity } from './verify-identity';

export interface PublishOptions extends yargs.Arguments {
  blueprint: string;
  publisher: string;
  cookie?: string;
  endpoint: string;
}

interface PublishingJob {
  publishingJobId: string;
  uploadUrl: string;
}

const mb = 1_024_000;

export async function publish(log: pino.BaseLogger, blueprint: string, publisher: string, endpoint: string, cookie?: string): Promise<void> {
  if (!fs.existsSync(blueprint)) {
    log.error('blueprint directory does not exist: %s', blueprint);
    process.exit(255);
  }

  const packageJsonPath = path.join(blueprint, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log.error('blueprint path does not contain a `package.json`, expected: %s', packageJsonPath);
    process.exit(255);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const fullyQualifiedBlueprintName: string = packageJson.name;
  const friendlyBlueprintName = fullyQualifiedBlueprintName.split('.').pop();
  const version = packageJson.version;

  const distributionFolder = path.join(blueprint, 'dist', 'js');
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

  // get the signature of the package
  const pipeline = util.promisify(stream.pipeline);
  const hash = crypto.createHash('sha384').setEncoding('hex');
  await pipeline(fs.createReadStream(fullPackagePath), hash);
  const packageSignature = hash.read();

  log.info(`Signature: [${packageSignature}]`);
  if (!packageSignature) {
    log.error('Unable to compute package signature');
    process.exit(254);
  }

  let header;

  cookie = cookie ?? process.env.CAWS_COOKIE;
  if (cookie) {
    log.info('Cookie found. Verifying identity...');
    const identity = await verifyIdentity({ endpoint, cookie });
    log.info(`Publishing as ${identity.name} at ${identity.email}`);

    header = {
      'authority': endpoint,
      'accept': 'application/json',
      'origin': `https://${endpoint}`,
      'cookie': cookie,
      'anti-csrftoken-a2z': identity.csrfToken,
      'content-type': 'application/json',
    };
  } else {
    log.info('CAWS_COOKIE was not provided by cli or environment. Fetching CodeCatalyst bearer token using the AWS CLI.');
    try {
      const codecatalystIdentity = await codecatalystVerifyIdentity(log);
      log.info(`Publishing as ${codecatalystIdentity.name} at ${codecatalystIdentity.email}`);

      header = {
        authorization: codecatalystIdentity.authorization,
      };
    } catch (error) {
      log.error('Failed to verify CodeCatalyst Identity.', error);
      if (error instanceof SSOServiceException) {
        log.error(
          'Please follow the link to use the CLI with Amazon CodeCatalyst:\n https://docs.aws.amazon.com/codecatalyst/latest/userguide/set-up-cli.html',
        );
      }
    }
  }
  log.info('Against endpoint: %s', endpoint);

  const gqlResponse = await axios.default.post(
    `https://${endpoint}/graphql?`,
    {
      query: `mutation {
        createBlueprintUploadUrl(input: {
          spaceName: "${publisher}",
          publisher: "${publisher}",
          packageSignature: "${packageSignature}",
          name: "${friendlyBlueprintName}",
          versionId: "${version}" }) {
            uploadUrl, publishingJobId }
          }`,
    },
    {
      headers: header,
    },
  );
  if (gqlResponse.status != 200) {
    log.error('unable to retrive upload url: %s', gqlResponse.data);
    process.exit(254);
  } else if (gqlResponse.data.errors?.[0]) {
    log.error(gqlResponse.data.errors[0]);
    process.exit(254);
  }

  const publishingJob = gqlResponse.data.data.createBlueprintUploadUrl as PublishingJob;
  log.info('Starting publishing job id: %s', publishingJob.publishingJobId);

  const uploadResponse = await axios.default.put(publishingJob.uploadUrl, fs.readFileSync(fullPackagePath), {
    // allow publishing of packages up to 5 gb
    maxBodyLength: 5 * 1000 * mb,
  });
  if (uploadResponse.status != 200) {
    log.error('failed to upload template package: %s', uploadResponse.status);
    process.exit(254);
  }

  log.info('Uploaded package for processing!');
}
