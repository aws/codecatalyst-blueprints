import {
  S3Client,
  ListBucketsCommand,
  ListBucketsCommandOutput,
  CreateBucketCommand,
  GetBucketLocationCommand,
  GetBucketLocationCommandOutput,
  PutObjectCommand,
  GetBucketPolicyCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';

import * as pino from 'pino';
import { Image } from './upload-image-to-aws';

const s3Client = new S3Client({});

/**
 * Check if bucket exists.
 */
const bucketExists = (listBucketsCommandResponse: ListBucketsCommandOutput, fullBucketName: string): boolean => {
  for (let bucket of listBucketsCommandResponse.Buckets || []) {
    if (bucket.Name == fullBucketName) return true;
  }
  return false;
};

/**
 * Appends new statement to existing bucket policy.
 */
const appendBucketPolicy = (bucketName: string, bucketPolicyJsonString: string, originAccessIdentityId: string): string => {
  const bucketPolicyJsonObject: any = JSON.parse(bucketPolicyJsonString);
  const statementArray = bucketPolicyJsonObject.Statement;

  let lastArrayElement: any;
  let newSid: string = '';

  if (statementArray) {
    lastArrayElement = statementArray[statementArray.length - 1];
    newSid = (Number(lastArrayElement.Sid) + 1).toString();
  }

  const newStatementString: string = `{
        "Sid": "${newSid}",
        "Effect": "Allow",
        "Principal": {
            "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${originAccessIdentityId}"
        },
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::${bucketName}/*"
    }`;

  const newStatementObject: any = JSON.parse(newStatementString);
  bucketPolicyJsonObject.Statement.push(newStatementObject);

  return JSON.stringify(bucketPolicyJsonObject);
};

/**
 * Creates new bucket policy.
 */
const createBucketPolicy = (bucketName: string, originAccessIdentityId: string): string => {
  let bucketPolicyJsonString: string = `{
        "Version": "2008-10-17",
        "Id": "PolicyForCloudFrontPrivateContent",
        "Statement": [
            {
                "Sid": "1",
                "Effect": "Allow",
                "Principal": {
                    "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${originAccessIdentityId}"
                },
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::${bucketName}/*"
            }
        ]
    }`;

  return bucketPolicyJsonString;
};

function sleep(milliseconds: number) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

/**
 * Creates a bucket if it does not exist.
 */
export const makeBucket = async (
  log: pino.BaseLogger,
  bucketName: string,
  region: string,
): Promise<{
  fullBucketName: string;
  bucketRegion: string;
}> => {
  const fullBucketName: string = `${bucketName}-${region}`;

  let listBucketsCommandResponse: ListBucketsCommandOutput;
  let getBucketLocationCommandResponse: GetBucketLocationCommandOutput;

  try {
    log.info(
      `Bucket to find: ${fullBucketName} (Note: the actual bucket name listed here is user-input bucket name + region name to make it globally unique)`,
    );
    listBucketsCommandResponse = await s3Client.send(new ListBucketsCommand({}));
  } catch (error) {
    log.error('Error finding existing bucket: \n');
    throw error;
  }

  if (bucketExists(listBucketsCommandResponse, fullBucketName)) {
    log.info(`Bucket '${fullBucketName}' found`);
  } else {
    try {
      log.info(`Bucket '${fullBucketName}' not found, creating new bucket with name '${fullBucketName}' ...`);

      await s3Client.send(
        new CreateBucketCommand({
          Bucket: fullBucketName,
        }),
      );

      log.info(`Bucket '${fullBucketName}' created`);
    } catch (error) {
      log.error('Error creating bucket: \n');
      throw error;
    }
  }

  try {
    getBucketLocationCommandResponse = await s3Client.send(
      new GetBucketLocationCommand({
        Bucket: fullBucketName,
      }),
    );

    if (getBucketLocationCommandResponse.LocationConstraint) {
      log.info(`Bucket is deployed in '${getBucketLocationCommandResponse.LocationConstraint}'`);
    } else {
      throw new Error('Bucket region not found in response'); // this should never happen
    }
  } catch (error) {
    log.error('Error getting bucket region: \n');
    throw error;
  }

  return {
    fullBucketName: fullBucketName,
    bucketRegion: getBucketLocationCommandResponse.LocationConstraint,
  };
};

/**
 * Uploads image to bucket (overwrites the existing image if image with the same name exists).
 */
export const uploadImageToBucket = async (log: pino.BaseLogger, bucketName: string, image: Image): Promise<void> => {
  try {
    log.info(`Uploading image '${image.name}' to bucket '${bucketName}' ...`);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: image.name,
        Body: image.body,
      }),
    );

    log.info(`Uploaded image '${image.name}' to bucket '${bucketName}'`);
  } catch (error) {
    log.error('Error uploading image to bucket: \n');
    throw error;
  }
};

/**
 * Retrieves and updates bucket policy to grant access to CloudFront distribution.
 */
export const updateBucketPolicy = async (log: pino.BaseLogger, bucketName: string, originAccessIdentityId: string): Promise<void> => {
  let bucketPolicy: string;

  try {
    log.info(`Retrieving bucket policy for bucket '${bucketName}' ...`);

    const getBucketPolicyCommandResponse = await s3Client.send(
      new GetBucketPolicyCommand({
        Bucket: bucketName,
      }),
    );

    if (getBucketPolicyCommandResponse.Policy) {
      log.info(`Bucket policy for bucket '${bucketName}' retrieved`);
      bucketPolicy = appendBucketPolicy(bucketName, getBucketPolicyCommandResponse.Policy, originAccessIdentityId);
    } else {
      throw new Error('Empty/Malformed bucket policy found in response'); // this should never happen
    }
  } catch (error) {
    log.info(`Bucket policy not found, creating new bucket policy for bucket '${bucketName}'`);
    bucketPolicy = createBucketPolicy(bucketName, originAccessIdentityId);
  }

  try {
    log.info(`Updating bucket policy for bucket '${bucketName}' ... (it will take a few seconds to update)`);

    // The SDK call isn't accurate. The existence seems to be there via the SDK, but the identity itself isn't immediately valid.
    // The policy takes a second to make itself valid. We can choose to do this validity check in a loop in the future.
    await sleep(15000);

    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: bucketPolicy,
      }),
    );

    log.info(`Bucket policy for bucket '${bucketName}' updated`);
  } catch (error) {
    log.error(`Error updating bucket policy for bucket '${bucketName}': \n`);
    throw error;
  }
};
