import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3_deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { CfnCanary } from 'aws-cdk-lib/aws-synthetics';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import * as iam from 'aws-cdk-lib/aws-iam';

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const frontendSourceBucket = new s3.Bucket(this, 'FrontendAppBucket', {
      websiteIndexDocument: 'index.html',
    });

    const frontendOriginAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'FrontendAppOIA', {
      comment: 'Access from CloudFront to the bucket.',
    });

    frontendSourceBucket.grantRead(frontendOriginAccessIdentity);

    const frontendCloudfront = new cloudfront.CloudFrontWebDistribution(this, 'FrontendAppCloudFront', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: frontendSourceBucket,
            originAccessIdentity: frontendOriginAccessIdentity,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
        {
          customOriginSource: {
            domainName: `${this.node.tryGetContext('api_domain')}`,
            originPath: `/${this.node.tryGetContext('api_stage')}`,
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            allowedOriginSSLVersions: [cloudfront.OriginSslPolicy.TLS_V1_2],
          },
          behaviors: [
            {
              pathPattern: '/t/*',
              allowedMethods: cloudfront.CloudFrontAllowedMethods.ALL,
              cachedMethods: cloudfront.CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,
              defaultTtl: cdk.Duration.seconds(0),
              minTtl: cdk.Duration.seconds(0),
              maxTtl: cdk.Duration.seconds(0),
              viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
              forwardedValues: {
                queryString: true,
                cookies: {
                  forward: 'all',
                },
                headers: ['Authorization'],
              },
            },
          ],
        },
      ],
      errorConfigurations: [
        {
          errorCode: 404,
          errorCachingMinTtl: 0,
          responseCode: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    new s3_deployment.BucketDeployment(this, 'FrontendAppDeploy', {
      sources: [s3_deployment.Source.asset('build')],
      destinationBucket: frontendSourceBucket,
      distribution: frontendCloudfront,
      distributionPaths: ['/*'],
    });

    const frontendUrl = `https://${frontendCloudfront.distributionDomainName}/`;
    new cdk.CfnOutput(this, 'appUrl', {
      value: frontendUrl,
    });

    /*
    Set the canary name with the length not exceeding 21 characters due to 
    naming constraint in cloudwatch Synthetics 
    */
    const canaryName = id.toLowerCase().substring(0, 21);

    const canaryExecutionConfig = {
      memoryInMb: 2000,
      timeout: 45,
      syntheticRuntimeVersion: 'syn-nodejs-puppeteer-3.8',
      frequency: 0,
    };

    /*
    Expression to set the canary to run only once
    To run it on a desired frequency, please update the expression
    https://docs.aws.amazon.com/AmazonSynthetics/latest/APIReference/API_CanaryScheduleInput.html
    */
    const canaryScheduleExpression = `rate(${canaryExecutionConfig.frequency} minute)`;

    const canaryAsset = new Asset(this, 'canaryCode', {
      path: 'build/canary',
    });

    const canaryResultsBucketName = `${id.toLowerCase()}-canary-results`;
    const iamRoleName = 'iamRoleName';

    const canaryResultsBucket = new s3.Bucket(this, canaryResultsBucketName, {
      bucketName: canaryResultsBucketName,
    });

    // SyntheticsExecutionRole requires several permissions to AWS resources as defined in
    // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-synthetics-canary.html#cfn-synthetics-canary-executionrolearn

    // Canary needs following permissions to run on VPC
    // https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Canaries_VPC.html

    const cloudWatchSyntheticsRolePolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['ec2:CreateNetworkInterface', 'ec2:DescribeNetworkInterfaces', 'ec2:DeleteNetworkInterface'],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:PutObject'],
          resources: [canaryResultsBucket.arnForObjects('*')],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:GetBucketLocation'],
          resources: [canaryResultsBucket.bucketArn],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['logs:CreateLogStream', 'logs:PutLogEvents', 'logs:CreateLogGroup'],
          resources: [`'arn:${this.partition}:logs:${this.region}:${this.account}:log-group:/aws/lambda/cwsyn-*'`],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:ListAllMyBuckets'],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['cloudwatch:PutMetricData'],
          resources: ['*'],
          conditions: {
            StringLike: { 'cloudwatch:namespace': '*CloudWatchSynthetics' },
          },
        }),
      ],
    });

    const cloudWatchSyntheticsRole = new iam.Role(this, iamRoleName, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: iamRoleName,
      path: '/service-role/',
      description: 'UX Canaries Execution Role',
      inlinePolicies: { CloudWatchSyntheticsRolePolicy: cloudWatchSyntheticsRolePolicy },
    });

    new CfnCanary(this, canaryName, {
      artifactS3Location: `s3://${canaryResultsBucket.bucketName}`,
      code: {
        handler: 'index.handler',
        s3Bucket: canaryAsset.s3BucketName,
        s3Key: canaryAsset.s3ObjectKey,
      },
      executionRoleArn: cloudWatchSyntheticsRole.roleArn,
      name: canaryName,
      runConfig: {
        memoryInMb: canaryExecutionConfig.memoryInMb,
        timeoutInSeconds: canaryExecutionConfig.timeout,
        environmentVariables: {
          SITE_URL: frontendUrl,
        },
      },
      runtimeVersion: canaryExecutionConfig.syntheticRuntimeVersion,
      schedule: {
        // durationInSeconds: canaryExecutionConfig.duration,
        expression: canaryScheduleExpression,
      },
      startCanaryAfterCreation: false,
    });
  }
}
