import path from 'path';
import {
  CloudFrontClient,
  CreateCloudFrontOriginAccessIdentityCommand,
  CreateDistributionCommand,
  GetCloudFrontOriginAccessIdentityCommand,
  paginateListDistributions,
} from '@aws-sdk/client-cloudfront';

import * as pino from 'pino';
import { Image } from './upload-image-to-aws';

const cloudfrontClient = new CloudFrontClient({});

/**
 * Create and return origin access identity ID that will be used in CloudFront distribution creation and granting access to S3 bucket.
 */
export const getOriginAccessIdentityId = async (log: pino.BaseLogger, bucketName: string): Promise<string> => {
  try {
    log.info('Creating origin access identity ...');
    const createOAICommandResponse = await cloudfrontClient.send(
      new CreateCloudFrontOriginAccessIdentityCommand({
        CloudFrontOriginAccessIdentityConfig: {
          CallerReference: Date.now().toString(),
          Comment: `This origin access identity is used to access bucket '${bucketName}'`,
        },
      }),
    );

    if (createOAICommandResponse.CloudFrontOriginAccessIdentity?.Id) {
      log.info('Origin access identity created');
      return createOAICommandResponse.CloudFrontOriginAccessIdentity?.Id;
    }

    throw new Error('Origin access identity ID not found in response');
  } catch (error) {
    log.error('Error creating origin access identity: \n');
    throw error;
  }
};

/**
 * Returns the DomainName of an existing cloudfront distro
 * @s3Bucket s3 bucket used as the origin for the cloudfront distro
 * @returns DomainName to the cloudfront distro
 */
export const getExistingCloudfrontDistro = async (log: pino.BaseLogger, s3Bucket: string): Promise<string | undefined> => {
  for await (const page of paginateListDistributions(
    {
      pageSize: 25,
      client: cloudfrontClient,
    },
    {},
  )) {
    for (const distro of page.DistributionList?.Items || []) {
      if ((distro.Origins?.Items?.map(item => item.Id) || []).includes(s3Bucket)) {
        log.info(`Existing cloudfront distribution exists, domain name: ${distro.DomainName}`);
        return distro.DomainName;
      }
    }
  }
  return undefined;
};

/**
 * Creates Cloudfront distribution and returns the URL to image.
 */
export const createCloudFrontDistribution = async (
  log: pino.BaseLogger,
  bucketName: string,
  region: string,
  originAccessIdentityId: string,
  image: Image,
): Promise<string> => {
  try {
    log.info('Creating CloudFront distribution ...');
    const createDistributionCommandResponse = await cloudfrontClient.send(
      new CreateDistributionCommand({
        DistributionConfig: {
          CallerReference: Date.now().toString(),
          Origins: {
            Items: [
              {
                DomainName: `${bucketName}.s3.${region}.amazonaws.com`, // domain URL
                Id: bucketName, // actual name/title of origin
                S3OriginConfig: {
                  OriginAccessIdentity: `origin-access-identity/cloudfront/${originAccessIdentityId}`,
                },
              },
            ],
            Quantity: 1,
          },
          DefaultCacheBehavior: {
            TargetOriginId: bucketName, // actual name/title of origin
            CachePolicyId: 'b2884449-e4de-46a7-ac36-70bc7f1ddd6d', // officially managed cache policy
            ViewerProtocolPolicy: 'redirect-to-https',
          },
          Comment: `This distribution stores the images within the bucket '${bucketName}'`,
          Enabled: true,
        },
      }),
    );

    log.info('CloudFront distribution created');

    if (createDistributionCommandResponse.Distribution?.DomainName) {
      return path.join(createDistributionCommandResponse.Distribution.DomainName, image.folder ?? '', image.name);
    }

    throw new Error('Domain name not found in response');
  } catch (error) {
    log.error('Error creating CloudFront distribution: \n');
    throw error;
  }
};

/**
 * Check if an origin access identity ID exists.
 */
export const validateOriginAccessIdentityId = async (log: pino.BaseLogger, originAccessIdentityId: string): Promise<void> => {
  try {
    log.info('Validating origin access identity ...');

    await cloudfrontClient.send(
      new GetCloudFrontOriginAccessIdentityCommand({
        Id: originAccessIdentityId,
      }),
    );

    log.info('Origin access identity validated');
  } catch (error) {
    log.error('Error validating origin access identity: \n');
    throw error;
  }
};
