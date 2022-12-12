import fs from 'fs';
import path from 'path';

import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

import * as pino from 'pino';
import * as yargs from 'yargs';
import * as cloudfrontFunctions from './cloudfront';
import { getExistingCloudfrontDistro } from './cloudfront';
import * as s3Functions from './s3';

export interface UploadOptions extends yargs.Arguments {
  pathToImage: string;
  bucket?: string;
  region?: string;
}

/**
 * Represents the content of an image.
 */
export interface Image {
  name: string;
  body: Buffer;
  extension: string | undefined;
}

/**
 * Checks that the caller is auth'd to a specific aws account.
 * @returns aws account ID
 */
const verifyAWSAccount = async (log: pino.BaseLogger): Promise<string> => {
  let callerIdentity;
  try {
    callerIdentity = await new STSClient({}).send(new GetCallerIdentityCommand({}));
  } catch (error) {
    log.error('ERROR: Running STS GetCallerIdentity');
    throw new Error('Are you logged into an aws account?');
  }

  log.info(`Publishing under account [${callerIdentity.Account}]`);
  if (!callerIdentity.Account) {
    throw new Error(`You aren't logged into an aws account. Account information: ${JSON.stringify(callerIdentity, null, 2)}`);
  }
  return callerIdentity.Account;
};

/**
 * Uploads specified image to S3 bucket, and returns CloudFront distribution URL to the image.
 */
export const uploadImagePublicly = async (
  log: pino.BaseLogger,
  pathToImage: string,
  options?: {
    bucketName?: string;
    region?: string;
  },
): Promise<{
  imageUrl: string;
  imageName: string;
}> => {
  const accountId = await verifyAWSAccount(log);

  const fullOptions = {
    // by default we make buckets globally unique by accountId
    bucketName: options?.bucketName || `blueprint-image-${accountId}`,
    region: options?.region || 'us-west-2',
  };

  const image: Image = {
    name: path.basename(pathToImage),
    body: fs.readFileSync(pathToImage),
    extension: pathToImage.split('.').pop(),
  };

  const extensionList: string[] = ['png', 'jpeg', 'jpg', 'jpe', 'jif', 'jfif', 'jfi', 'gif', 'bmp', 'dib', 'tiff', 'tif', 'svg', 'svgz'];

  if (!image.extension || !extensionList.includes(image.extension)) {
    log.error('ERROR: Unsupported image type');
    throw new Error(`Image type '${image.extension}' is not supported. Please make sure the image type is in the supported list. \n
      Supported image type: ${extensionList.join(', ')} \n`);
  }

  log.info(`Full path to image: ${pathToImage}`);
  log.info(`Region to deploy: ${fullOptions.region}`);

  const { fullBucketName, bucketRegion } = await s3Functions.makeBucket(log, fullOptions.bucketName, fullOptions.region);
  await s3Functions.uploadImageToBucket(log, fullBucketName, image);

  const existingCloudfrontDomain = await getExistingCloudfrontDistro(log, fullBucketName);
  if (existingCloudfrontDomain) {
    return {
      imageUrl: `${existingCloudfrontDomain}/${image.name}`,
      imageName: image.name,
    };
  }

  const originAccessIdentityId = await cloudfrontFunctions.getOriginAccessIdentityId(log, fullBucketName);
  const imageURL = await cloudfrontFunctions.createCloudFrontDistribution(log, fullBucketName, bucketRegion, originAccessIdentityId, image);
  await s3Functions.updateBucketPolicy(log, fullBucketName, originAccessIdentityId);

  return {
    imageUrl: imageURL,
    imageName: image.name,
  };
};
