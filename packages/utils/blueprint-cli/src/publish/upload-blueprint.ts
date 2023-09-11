import * as crypto from 'crypto';
import * as fs from 'fs';
import * as stream from 'stream';
import * as util from 'util';
import * as axios from 'axios';
import * as pino from 'pino';
import { CodeCatalystAuthentication, generateHeaders } from './codecatalyst-authentication';
import { IdentityResponse } from './verify-identity';

export async function uploadBlueprint(
  log: pino.BaseLogger,
  packagePath: string,
  endpoint: string,
  blueprint: {
    publishingSpace: string;
    targetSpace: string;
    packageName: string;
    version: string;
    authentication: CodeCatalystAuthentication;
    identity: IdentityResponse;
  },
) {
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

  log.info(`Start publishing blueprint package to ${blueprint.targetSpace}.`);

  const gqlPublishBlueprintPackageResponse = await axios.default.post(
    `https://${endpoint}/graphql?`,
    {
      query: `mutation {
        publishBlueprintPackage(input: {
          spaceName: "${blueprint.targetSpace}",
          blueprintName: "${blueprint.packageName.split('.').pop()}",
          version: "${blueprint.version}" }) {
            uploadUrl, publishingJobId }
          }`,
    },
    {
      headers: {
        'authority': endpoint,
        'origin': `https://${endpoint}`,
        'accept': 'application/json',
        'content-type': 'application/json',
        ...generateHeaders(blueprint.authentication, blueprint.identity),
      },
    },
  );
  if (gqlPublishBlueprintPackageResponse.status != 200) {
    log.error('Failed to publish blueprint package: %s', gqlPublishBlueprintPackageResponse.status);
    process.exit(254);
  }

  const publishingStatusId = gqlPublishBlueprintPackageResponse.data.data.publishingStatusId;
  log.info('Published blueprint package with status Id: %s, checking publishing status.', publishingStatusId);

  let retries = 0;
  let gqlGetPublishBlueprintStatusResponse;
  let publishingBlueprintStatus;
  while (retries < 5) {
    gqlGetPublishBlueprintStatusResponse = await axios.default.post(
      `https://${endpoint}/graphql?`,
      {
        query: `mutation {
        getPublishBlueprintStatus(input: {
          spaceName: "${blueprint.targetSpace}",
          blueprintName: "${blueprint.packageName.split('.').pop()}",
          id: "${publishingStatusId}",
          version: "${blueprint.version}" }) {
            uploadUrl, publishingJobId }
          }`,
      },
      {
        headers: {
          'authority': endpoint,
          'origin': `https://${endpoint}`,
          'accept': 'application/json',
          'content-type': 'application/json',
          ...generateHeaders(blueprint.authentication, blueprint.identity),
        },
      },
    );

    publishingBlueprintStatus = gqlGetPublishBlueprintStatusResponse.data.data.status;

    if (publishingBlueprintStatus == 'SUCCEEDED') {
      log.info('Successfully published blueprint package');
      return;
    } else if (publishingBlueprintStatus == 'FAILED') {
      log.error(
        'Failed to publish blueprint package: %s with reason: %s',
        gqlGetPublishBlueprintStatusResponse.status,
        gqlGetPublishBlueprintStatusResponse.data.data.reason,
      );
      process.exit(254);
    } else if (publishingBlueprintStatus == 'CANCELED') {
      log.info('Blueprint package publishing process is canceled.');
    } else {
      // wait for 2 seconds if the returned status is in progress
      await new Promise(completed => setTimeout(completed, 2000));
      retries++;
    }
  }
}
