import fs from 'fs';
import path from 'path';

import * as pino from 'pino';
import * as yargs from 'yargs';
import * as cloudfrontFunctions from './cloudfront';
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
}

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
  const fullOptions = {
    bucketName: options?.bucketName || 'blueprint-image', // the names 'blueprint-images' and 'blueprint-buckets' can not be used
    region: options?.region || 'us-west-2',
  };

  const image: Image = {
    name: path.basename(pathToImage),
    body: fs.readFileSync(pathToImage),
  };

  log.info(`Full path to image: ${pathToImage}`);
  log.info(`Region to deploy: ${fullOptions.region}`);

  const { fullBucketName, bucketRegion } = await s3Functions.makeBucket(log, fullOptions.bucketName, fullOptions.region);
  await s3Functions.uploadImageToBucket(log, fullBucketName, image);
  const originAccessIdentityId = await cloudfrontFunctions.getOriginAccessIdentityId(log, fullBucketName);
  const imageURL = await cloudfrontFunctions.createCloudFrontDistribution(log, fullBucketName, bucketRegion, originAccessIdentityId, image);
  await s3Functions.updateBucketPolicy(log, fullBucketName, originAccessIdentityId);

  return {
    imageUrl: imageURL,
    imageName: image.name,
  };
};
