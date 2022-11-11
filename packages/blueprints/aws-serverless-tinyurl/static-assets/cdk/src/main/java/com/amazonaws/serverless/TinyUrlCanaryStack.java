package com.amazonaws.serverless;

import software.amazon.awscdk.*;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.PolicyStatementProps;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.RoleProps;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketProps;
import software.amazon.awscdk.services.s3.assets.Asset;
import software.amazon.awscdk.services.synthetics.CfnCanary;
import software.amazon.awscdk.services.synthetics.CfnCanaryProps;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;


public class TinyUrlCanaryStack extends NestedStack {
    private final String tinyUrlApiEndpoint;
    private static final String AZ_CODE = "us-east-1";
    private static final Integer CANARY_SUCCESS_RETENTION_PERIOD = 7;
    private static final Integer CANARY_FAILURE_RETENTION_PERIOD = 31;
    //Bucket CONSTANT
    private static final String CANARY_RESULT_BUCKET_ID = "canaryResults";
    private static final String CANARY_RESULT_BUCKET_NAME = "cw-synthetics-results";
    //Role CONSTANT
    private static final String CANARY_ROLE_ID = "canaryExecutionRole";
    private static final String CANARY_ROLE_NAME = "cw-synthetics-role";
    private static final String CANARY_ROLE_DESCRIPTION = "Canary Execution Role";
    private static final String CANARY_ROLE_PATH = "/service-role/";
    // Asset CONSTANT
    private static final String ASSET_ID = "canaryCodeBundle";
    private static final String ASSET_PATH = "./testscripts";

    public TinyUrlCanaryStack(final Construct parent, final String stackName) {
        super(parent, stackName);

        this.tinyUrlApiEndpoint = Fn.importValue("TinyUrlRestApiEndpoint");

        // Create Bucket for Canary Logs
        Bucket resultBucket = createBucket(CANARY_RESULT_BUCKET_ID,
                CANARY_RESULT_BUCKET_NAME+ "-" + stackName.toLowerCase());

        CfnOutput.Builder.create(this, "TinyUrlCanaryLogsBucketName")
                .description("S3 bucket name used for storing the Tiny URL canary results")
                .value(resultBucket.getBucketName())
                .build();

        // Create a permission role for the Canary
        Role cwSyntheticsRole = createRole(CANARY_ROLE_ID,
            CANARY_ROLE_NAME,
            CANARY_ROLE_PATH,
            CANARY_ROLE_DESCRIPTION,
            resultBucket);

        // Create Asset for CDK
        Asset canaryCodeBundle = createAsset(ASSET_ID, ASSET_PATH);

        // S3 Bucket Location
        String s3Location = "s3://" + resultBucket.getBucketName();

        // Main -- Creating Canary
        String canaryName = stackName.toLowerCase();
        Map <String, String> envVar = new HashMap<String, String>();
        envVar.put("URL", this.tinyUrlApiEndpoint);

        new CfnCanary(this, canaryName, CfnCanaryProps.builder()
                .name(canaryName)
                .code(CfnCanary.CodeProperty.builder()
                        .s3Bucket(canaryCodeBundle.getS3BucketName())
                        .s3Key(canaryCodeBundle.getS3ObjectKey())
                        .handler("index.handler")
                        .build())
                .artifactS3Location(s3Location)
                .executionRoleArn(cwSyntheticsRole.getRoleArn())
                .schedule(CfnCanary.ScheduleProperty.builder().expression("rate(5 minutes)").build())
                .runtimeVersion("syn-nodejs-puppeteer-3.8")
                .startCanaryAfterCreation(true)
                .successRetentionPeriod(CANARY_SUCCESS_RETENTION_PERIOD)
                .failureRetentionPeriod(CANARY_FAILURE_RETENTION_PERIOD)
                .runConfig(CfnCanary.RunConfigProperty.builder()
                        .environmentVariables(envVar)
                        .build())
                .build());
    }

    // Bucket Creation
    private Bucket createBucket(final String id, final String name){
       return new Bucket(this, id, BucketProps.builder()
               .bucketName(String.join("-", name, AZ_CODE, "bucket"))
               .publicReadAccess(false)
               .autoDeleteObjects(true)
               .removalPolicy(RemovalPolicy.DESTROY)
               .build());
    }

    // Required Role Creation
    private Role createRole(final String id,
                            final String name,
                            final String path,
                            final String description,
                            final Bucket resultsBucket){

       Role createdRole = new Role(this, id, RoleProps.builder()
               .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
               .roleName(String.join("-", name, AZ_CODE, "test"))
               .description(description)
               .path(path)
               .build());
       createdRole.addToPolicy(new PolicyStatement(PolicyStatementProps.builder()
               .actions(Arrays.asList("synthetics:*"))
               .resources(Arrays.asList(resultsBucket.arnForObjects("*")))
               .build()));

       // CloudWatch Synthetics FullAccess Policy List
       createdRole.addToPolicy(new PolicyStatement(PolicyStatementProps.builder()
               .actions(Arrays.asList("s3:PutObject", "s3:GetBucketLocation"))
               .resources(Arrays.asList(resultsBucket.arnForObjects("*")))
               .build()));

       createdRole.addToPolicy(new PolicyStatement(PolicyStatementProps.builder()
               .actions(Arrays.asList("s3:ListAllMyBuckets"))
               .resources(Arrays.asList("*"))
               .build()));

       createdRole.addToPolicy(new PolicyStatement(PolicyStatementProps.builder()
               .actions(Arrays.asList("logs:CreateLogGroup",
                       "logs:CreateLogStream",
                       "logs:PutLogEvents"))
               .resources(Arrays.asList("arn:aws:logs:*:*:log-group:/aws/lambda/*"))
               .build()));

       createdRole.addToPolicy(new PolicyStatement(PolicyStatementProps.builder()
               .actions(Arrays.asList("cloudwatch:PutMetricData"))
               .resources(Arrays.asList("*"))
               .build()));

       return createdRole;
    }

    private Asset createAsset(final String assetId, final String path){
       return Asset.Builder
               .create(this, assetId)
               .path(path)
               .build();
    }

}
