import { basename } from 'path';
import { awscdk } from 'projen';
import { v4 as uuidv4 } from 'uuid'; // eslint-disable-line import/no-extraneous-dependencies
const TYPESCRIPT_EXT = '.ts';

export function getStackDefinition(params: {
  stackNameBase: string;
  backendStackName: string;
  frontendStackName: string;
  bucketName: string;
  frontEndFolder: string;
  lambdaOptions: awscdk.LambdaFunctionOptions[];
}) {
  const { stackNameBase, backendStackName, frontendStackName, bucketName, frontEndFolder, lambdaOptions } = params;

  const s3BucketName = getUniqueS3BucketName(bucketName);
  const appStack: string = frontendStackName;
  const apiStack: string = backendStackName;

  const lambdaImports = lambdaOptions.map(lambdaOption => {
    return `import { ${lambdaOption.constructName} } from './${basename(lambdaOption.constructFile!, TYPESCRIPT_EXT)}';`;
  });

  return (
    `import { App, Construct, Stack, StackProps, CfnOutput } from '@aws-cdk/core';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as path from 'path';

${lambdaImports.join('\n')}


const attachLambda = (
  api: apigateway.LambdaRestApi,
  stack: Stack,
  LambdaFunc: (new (options: Stack, name: string) => lambda.Function),
  name: string,
  options: {
    path: string;
    method: string[];
  }) => {
  const resource = api.root.addResource(options.path);
  options.method.forEach(method => {
    resource.addMethod(method, new apigateway.LambdaIntegration(new LambdaFunc(stack, name)));
  });
  new CfnOutput(stack, \`apiurl\${name}\`, { value: \`\${path.join(api.url, options.path)}/\` });
};

// backend stack
export class ${apiStack} extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    const api = new apigateway.LambdaRestApi(this, '${stackNameBase}.ApiGateway', {
      restApiName: '${stackNameBase}ApiGateway',
      // using ${lambdaOptions[0].constructName} as the default handler.
      handler: new ${lambdaOptions[0].constructName}(this, 'default-handler'),
      proxy: false,
      description: 'API gateway for ${backendStackName}',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS
      },
    });

    new CfnOutput(this, 'apiurl', { value: api.url });
    ` +
    lambdaOptions
      .map(lambdaOption => {
        return `
    // GET https://<CloudFrontURL>/${lambdaOption.constructName?.toLowerCase()}
    attachLambda(api, this, ${lambdaOption.constructName}, 'id-${lambdaOption.constructName}', {
      path: '${lambdaOption.constructName?.toLowerCase()}',
      method: ['GET']
    });`;
      })
      .join('\n') +
    `
  }
}

// Frontend stack
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
      \'${stackNameBase}OriginAccessIdentity\'
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
      sources: [s3deploy.Source.asset(\'./../${frontEndFolder}/build\')],
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

new ${apiStack}(app, \`${apiStack}\`, { env, stackName: \`${apiStack}\` });
new ${appStack}(app, \`${appStack}\`, { env, stackName: \`${appStack}\` });

app.synth();
`
  );
}

function getUniqueS3BucketName(bucketName: string) {
  return `${bucketName.toLowerCase()}-${uuidv4().toString().slice(0, 16)}`;
}

export function getStackTestDefintion(appEntrypoint: string, backendStackName: string, frontendStackName: string) {
  const appStack: string = backendStackName;
  const apiStack: string = frontendStackName;

  return `import { App } from \'@aws-cdk/core\';
import '@aws-cdk/assert/jest';
import { ${appStack}, ${apiStack} } from '../src/${basename(appEntrypoint, TYPESCRIPT_EXT)}';

 test('Snapshot ${appStack}', () => {
   const app = new App();
   const appStack = new ${appStack}(app, 'test', { env: { account: '123', region: 'test-region-1' } });
   expect(app.synth().getStackArtifact(appStack.artifactId).template).toMatchSnapshot();
 });

 test('Snapshot ${apiStack}', () => {
  const app = new App();
  const apiStack = new ${apiStack}(app, 'test', { env: { account: '123', region: 'test-region-1' } });
  expect(app.synth().getStackArtifact(apiStack.artifactId).template).toMatchSnapshot();
});
`;
}
