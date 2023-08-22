import * as crypto from 'crypto';
import * as fs from 'fs';
import * as stream from 'stream';
import * as util from 'util';
import * as axios from 'axios';
import * as pino from 'pino';
import { CodeCatalystAuthentication, generateHeaders } from './codecatalyst-authentication';

const mb = 1_024_000;

interface PublishingJob {
  publishingJobId: string;
  uploadUrl: string;
}

export async function uploadBlueprint(log: pino.BaseLogger, packagePath: string, endpoint: string, blueprint: {
  publishingSpace: string;
  targetSpace: string;
  packageName: string;
  version: string;
  authentication: CodeCatalystAuthentication;
}) {

  // get the signature of the package
  const pipeline = util.promisify(stream.pipeline);
  const hash = crypto.createHash('sha384').setEncoding('hex');
  await pipeline(fs.createReadStream(packagePath), hash);
  const packageSignature = hash.read();

  log.info(`Signature: [${packageSignature}]`);
  if (!packageSignature) {
    log.error('Unable to compute package signature');
    process.exit(254);
  }

  const gqlResponse = await axios.default.post(
    `https://${endpoint}/graphql?`,
    {
      query: `mutation {
        createBlueprintUploadUrl(input: {
          spaceName: "${blueprint.targetSpace}",
          publisher: "${blueprint.publishingSpace}",
          packageSignature: "${packageSignature}",
          name: "${blueprint.packageName.split('.').pop()}",
          versionId: "${blueprint.version}" }) {
            uploadUrl, publishingJobId }
          }`,
    },
    {
      headers: {
        'authority': endpoint,
        'origin': `https://${endpoint}`,
        'accept': 'application/json',
        'content-type': 'application/json',
        ...generateHeaders(blueprint.authentication),
      },
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

  const uploadResponse = await axios.default.put(publishingJob.uploadUrl, fs.readFileSync(packagePath), {
    // allow publishing of packages up to 5 gb
    maxBodyLength: 5 * 1000 * mb,
  });
  if (uploadResponse.status != 200) {
    log.error('failed to upload blueprint package: %s', uploadResponse.status);
    process.exit(254);
  }

  log.info('Uploaded package for processing!');
}
