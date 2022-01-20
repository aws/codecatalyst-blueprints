import { basename } from 'path';
import { awscdk } from 'projen';
import { Options } from './blueprint';

const TYPESCRIPT_EXT = '.ts';

export function getStackDefinition(stackName: string, blueprintOptions: Options, lambdaOptions: awscdk.LambdaFunctionOptions) {
  const s3BucketName = getUniqueS3BucketName(blueprintOptions.repositoryName);
  const appStack: string = `${stackName}Stack`;
  const apiStack: string = `${stackName}ApiStack`;

  return `import { App, Construct, Stack, StackProps, CfnOutput } from '@aws-cdk/core';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';
import * as cloudfront from '@aws-cdk/aws-cloudfront';

import { ${lambdaOptions.constructName} } from './${basename(lambdaOptions.constructFile!, TYPESCRIPT_EXT )}';

export class ${apiStack} extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const handler = new ${lambdaOptions.constructName}(this, \'${lambdaOptions.constructName}\');
    const api = new apigateway.LambdaRestApi(this, \'${appStack}ApiGateway\', {
      restApiName: \'${apiStack}ApiGateway\',
      handler,
      description: \'API gateway for ${apiStack}\',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS
      },
    });
    new CfnOutput(this, \'apiurl\', { value: api.url });
  }
}

export class ${appStack} extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    const mySiteBucket = new s3.Bucket(this, \'${s3BucketName}\', {
      bucketName: \`${s3BucketName}-\$\{props?.env?.region ?? 'us-west-2'\}\`,
      websiteIndexDocument: \'index.html\',
      publicReadAccess: false,
    });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      \'${appStack}OriginAccessIdentity\'
    );
    mySiteBucket.grantRead(originAccessIdentity);

    const distribution = new cloudfront.CloudFrontWebDistribution(this, \'distributionCDN\', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: mySiteBucket,
            originAccessIdentity,
          },
          behaviors: [{ isDefaultBehavior: true }],
        }
      ],
    });

    new s3deploy.BucketDeployment(this, \'ReactApp\', {
      sources: [s3deploy.Source.asset(\'./../${blueprintOptions.reactFolderName}/build\')],
      destinationBucket: mySiteBucket,
      distribution,
    });


    new CfnOutput(this, \'Bucket\', { value: mySiteBucket.bucketName });
    new CfnOutput(this, \'CloudFrontURL\', { value: \`https://\$\{distribution.distributionDomainName\}\` });
  }
}

const env = {
  region: process.env.awsRegion,
};

const app = new App();

new ${apiStack}(app, \`${apiStack}\`, { env });
new ${appStack}(app, \'${appStack}\', { env });

app.synth();
`;
}

function getUniqueS3BucketName(repositoryName: string) {
  return `${repositoryName.toLowerCase()}-${getSecondSinceEpoch()}`;
}

function getSecondSinceEpoch() {
  return Math.floor(Date.now() / 1000);
}

export function getStackTestDefintion(appEntrypoint: string, stackName: string) {
  const appStack: string = `${stackName}Stack`;
  return `import { App } from \'@aws-cdk/core\';
import '@aws-cdk/assert/jest';
import { ${appStack} } from '../src/${basename(appEntrypoint, TYPESCRIPT_EXT)}';

 test('Snapshot', () => {
   const app = new App();
   const stack = new ${appStack}(app, 'test', { env: { account: '123', region: 'test-region-1' } });

   expect(app.synth().getStackArtifact(stack.artifactId).template).toMatchSnapshot();
 });
`;
}
