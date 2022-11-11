package com.amazonaws.serverless;

import software.amazon.awscdk.*;
import software.amazon.awscdk.services.apigateway.IResource;
import software.amazon.awscdk.services.apigateway.*;
import software.amazon.awscdk.services.dynamodb.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.lambda.*;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.deployment.BucketDeployment;
import software.amazon.awscdk.services.s3.deployment.ISource;
import software.amazon.awscdk.services.s3.deployment.Source;
import software.constructs.Construct;

import java.util.*;

public class TinyUrlAppStack extends NestedStack {

    private static final String GET_URL_LAMBDA = "getUrlFunction";
    private static final String GET_URL_LAMBDA_HANDLER = "com.amazonaws.serverless.lambda.GetUrlRequestHandler";
    private static final String CREATE_URL_LAMBDA = "createUrlFunction";
    private static final String CREATE_URL_LAMBDA_HANDLER = "com.amazonaws.serverless.lambda.CreateUrlRequestHandler";
    private static final String DYNAMODB_TABLE_NAME = "tbl_tiny_url";
    private static final String S3_BUCKET_NAME = "static-website-content";
    private static final String DYNAMODB_TABLE_PRIMARY_KEY = "id";

    private static final String API_GATEWAY_S3_ASSUME_ROLE = "tinyUrlApiGatewayS3AssumeRole";
    private static final String REST_API_ID = "tinyUrlApi";
    private static final String REST_API_NAME = "TinyUrlService";
    private static final String REST_API_GET_TINY_URL = "{tinyUrl}";
    private static final String REST_API_CREATE_TINY_URL = "createTinyUrl";
    private static final String GET = HttpMethod.GET.name();
    private static final String POST = HttpMethod.POST.name();

    public TinyUrlAppStack(final Construct parent, final String stackName) {
        super(parent, stackName);

        // S3 Bucket resource and Content
        Bucket siteBucket = createBucket(S3_BUCKET_NAME+ "-" + stackName.toLowerCase());

        CfnOutput.Builder.create(this, "TinyUrlStaticSiteBucketName")
                .description("S3 bucket name used for Tiny URL static website")
                .value(siteBucket.getBucketName())
                .exportName("TinyUrlStaticSiteBucketName")
                .build();

        // Create dynamodb table
        Table urlTable = defineDynamoTable(DYNAMODB_TABLE_NAME, DYNAMODB_TABLE_PRIMARY_KEY);

        CfnOutput.Builder.create(this, "TinyUrlDynamoDbTableName")
                .description("DynamoDB table used for storing Tiny URL")
                .value(siteBucket.getBucketName())
                .exportName("TinyUrlDynamoDbTableName")
                .build();

        final Map<String, String> lambdaEnv = new HashMap<>();
        lambdaEnv.put("TABLE_NAME", DYNAMODB_TABLE_NAME);
        lambdaEnv.put("PRIMARY_KEY", DYNAMODB_TABLE_PRIMARY_KEY);

        // Create lambda functions
        Function getTinyUrlFunction = defineLambdaFunction(lambdaEnv,
                GET_URL_LAMBDA,
                GET_URL_LAMBDA_HANDLER);
        urlTable.grantReadData(getTinyUrlFunction);

        Function createTinyUrlFunction = defineLambdaFunction(lambdaEnv,
                CREATE_URL_LAMBDA,
                CREATE_URL_LAMBDA_HANDLER);
        urlTable.grantReadWriteData(createTinyUrlFunction);

        // Create the API Gateway
        RestApi tinyUrlApi = defineRestApi(REST_API_ID, REST_API_NAME);
        IResource getTinyUrlResource = tinyUrlApi.getRoot().addResource(REST_API_GET_TINY_URL);
        IResource createTinyUrlResource = tinyUrlApi.getRoot().addResource(REST_API_CREATE_TINY_URL);
        IResource loadTinyUrlPageResource = tinyUrlApi.getRoot();

        LambdaIntegrationOptions lambdaIntegrationOptions = LambdaIntegrationOptions.builder().proxy(true).build();

        Integration getTinyUrlIntegration = new LambdaIntegration(getTinyUrlFunction, lambdaIntegrationOptions);
        getTinyUrlResource.addMethod(GET, getTinyUrlIntegration);

        Integration createTinyUrlIntegration = new LambdaIntegration(createTinyUrlFunction, lambdaIntegrationOptions);
        createTinyUrlResource.addMethod(POST, createTinyUrlIntegration);

        // Create IAM role for APIGateway to access S3 static site content
        Role apiGatewayS3AccessRole = defineApiGatewayS3AccessRole(API_GATEWAY_S3_ASSUME_ROLE);

        IntegrationOptions s3Options = getS3IntegrationOptions(apiGatewayS3AccessRole);

        Integration loadTinyUrlPageIntegration = AwsIntegration.Builder.create()
                .service("s3")
                .integrationHttpMethod(GET)
                .options(s3Options)
                .path(siteBucket.getBucketName() + "/index.html")
                .build();

        loadTinyUrlPageResource.addMethod(GET, loadTinyUrlPageIntegration)
                .addMethodResponse(getApiGatewayMethodResponse());

        CfnOutput.Builder.create(this, "TinyUrlRestApiEndpoint")
                .description("RestApi endpoint for Tiny URL service")
                .value(tinyUrlApi.getUrl())
                .exportName("TinyUrlRestApiEndpoint")
                .build();
    }

    private MethodResponse getApiGatewayMethodResponse() {
        Map<String, Boolean> responseParameter = new HashMap<String, Boolean>();
        responseParameter.put("method.response.header.Content-Type", true);

        return MethodResponse.builder()
                .statusCode("200")
                .responseParameters(responseParameter)
                .build();
    }

    private Role defineApiGatewayS3AccessRole(final String roleName) {
        final RoleProps roleProps = RoleProps.builder()
                .assumedBy(ServicePrincipal.Builder.create("apigateway.amazonaws.com").build())
                .roleName(roleName).build();

        PolicyStatement ApiGatewayS3AccessPolicy = PolicyStatement.Builder.create().actions(
                        Arrays.asList("s3:Get*", "s3:List*", "s3-object-lambda:Get*", "s3-object-lambda:List*"))
                .resources(Arrays.asList("*"))
                .build();

        Role apiGatewayS3AccessRole = new Role(this, "ApiGatewayS3AssumeRole", roleProps);

        apiGatewayS3AccessRole.addToPolicy(ApiGatewayS3AccessPolicy);
        return apiGatewayS3AccessRole;
    }

    private IntegrationOptions getS3IntegrationOptions(IRole role) {
        List<IntegrationResponse> s3IntegrationResponses = new ArrayList<>();
        Map<String, String> s3ResponseParameters = new HashMap<>();
        s3ResponseParameters.put("method.response.header.Content-Type", "integration.response.header.Content-Type");
        s3IntegrationResponses.add(IntegrationResponse.builder()
                .responseParameters(s3ResponseParameters)
                .statusCode("200")
                .build());
        IntegrationOptions s3IntegrationOptions = IntegrationOptions.builder()
                .credentialsRole(role)
                .integrationResponses(s3IntegrationResponses)
                .build();

        return s3IntegrationOptions;
    }

    private Bucket createBucket(String name) {
        Bucket siteBucket =
                Bucket.Builder.create(this, "StaticContentS3Bucket")
                        .bucketName(name)
                        .publicReadAccess(false)
                        .removalPolicy(RemovalPolicy.DESTROY)
                        .build();

        List<ISource> sources = new ArrayList<>(1);
        sources.add(Source.asset("./site-contents"));

        BucketDeployment.Builder.create(this, "DeploySiteContent")
                .sources(sources)
                .destinationBucket(siteBucket)
                .build();

        return siteBucket;
    }

    private FunctionProps getLambdaFunctionProps(Map<String, String> lambdaEnvMap, String handler) {
        return FunctionProps.builder()
                .code(Code.fromAsset("./asset/lambda-1.0.0-jar-with-dependencies.jar"))
                .handler(handler)
                .runtime(Runtime.JAVA_8)
                .environment(lambdaEnvMap)
                .timeout(Duration.seconds(30))
                .memorySize(512)
                .build();
    }

    private Table defineDynamoTable(String tableName, String partitionKey) {
        Attribute partitionKeyAttribute = Attribute.builder()
                .name(partitionKey)
                .type(AttributeType.STRING)
                .build();
        TableProps tableProps = TableProps.builder()
                .billingMode(BillingMode.PAY_PER_REQUEST)
                .tableName(tableName)
                .partitionKey(partitionKeyAttribute)
                .removalPolicy(RemovalPolicy.RETAIN)
                .build();
        Table dynamodbTable = new Table(this, tableName, tableProps);
        return dynamodbTable;
    }

    private Function defineLambdaFunction(Map<String, String> lambdaEnvMap, String lambdaFunctionName, String handlerPath) {
        Function lambdaFunction = new Function(this, lambdaFunctionName,
                getLambdaFunctionProps(lambdaEnvMap, handlerPath));
        return lambdaFunction;
    }

    private RestApi defineRestApi(String id, String restApiName) {
        RestApi restApi = new RestApi(this, id,
                RestApiProps.builder().restApiName(restApiName).build());
        return restApi;
    }

}
