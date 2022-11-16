package com.amazonaws.serverless;

import software.amazon.awscdk.*;
import software.amazon.awscdk.services.apigateway.IResource;
import software.amazon.awscdk.services.apigateway.*;
import software.amazon.awscdk.services.dynamodb.*;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.lambda.*;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class TinyUrlAppStack extends Stack {

    private static final String GET_URL_LAMBDA = "getUrlFunction";
    private static final String GET_URL_LAMBDA_HANDLER = "com.amazonaws.serverless.lambda.GetUrlRequestHandler";
    private static final String CREATE_URL_LAMBDA = "createUrlFunction";
    private static final String CREATE_URL_LAMBDA_HANDLER = "com.amazonaws.serverless.lambda.CreateUrlRequestHandler";
    private static final String DYNAMODB_TABLE_NAME = "tbl_tiny_url";
    private static final String DYNAMODB_TABLE_PRIMARY_KEY = "id";
    private static final String REST_API_GET_TINY_URL = "{tinyUrl}";
    private static final String REST_API_CREATE_TINY_URL = "createTinyUrl";
    private static final String GET = HttpMethod.GET.name();
    private static final String POST = HttpMethod.POST.name();

    public TinyUrlAppStack(final Construct parent, final String stackName, final StackProps props) {
        super(parent, stackName, props);

        // Create dynamodb table
        Table urlTable = defineDynamoTable(DYNAMODB_TABLE_NAME, DYNAMODB_TABLE_PRIMARY_KEY);

        CfnOutput.Builder.create(this, "BackendDynamoTable").value(urlTable.getTableName()).build();

        Object origins = this.getNode().tryGetContext("origins");
        final String allowedOrigins = (origins == null ? "*" : origins.toString());

        final Map<String, String> lambdaEnv = new HashMap<>();
        lambdaEnv.put("TABLE_NAME", DYNAMODB_TABLE_NAME);
        lambdaEnv.put("PRIMARY_KEY", DYNAMODB_TABLE_PRIMARY_KEY);
        lambdaEnv.put("ALLOWED_ORIGINS", allowedOrigins);

        // Create lambda functions
        Function getTinyUrlFunction = defineLambdaFunction(lambdaEnv, GET_URL_LAMBDA, GET_URL_LAMBDA_HANDLER);
        urlTable.grantReadData(getTinyUrlFunction);

        Function createTinyUrlFunction = defineLambdaFunction(lambdaEnv, CREATE_URL_LAMBDA, CREATE_URL_LAMBDA_HANDLER);
        urlTable.grantReadWriteData(createTinyUrlFunction);

        // Create the API Gateway
        RestApi apiGateway = new RestApi(this, "TinyUrlApiGateway", RestApiProps.builder()
                .defaultCorsPreflightOptions(CorsOptions.builder()
                        .allowCredentials(true)
                        .allowMethods(Arrays.asList("GET", "POST", "OPTIONS"))
                        .allowHeaders(Arrays.asList("Content-Type", "Authorization", "Content-Length", "X-Requested-With"))
                        .allowOrigins(Arrays.asList(allowedOrigins.split(",")))
                        .build()).build());

        IResource api = apiGateway.getRoot().addResource("t");
        IResource getTinyUrlResource = api.addResource(REST_API_GET_TINY_URL);
        IResource createTinyUrlResource = api.addResource(REST_API_CREATE_TINY_URL);

        LambdaIntegrationOptions lambdaIntegrationOptions = LambdaIntegrationOptions.builder().proxy(true).build();

        Integration getTinyUrlIntegration = new LambdaIntegration(getTinyUrlFunction, lambdaIntegrationOptions);
        getTinyUrlResource.addMethod(GET, getTinyUrlIntegration);

        Integration createTinyUrlIntegration = new LambdaIntegration(createTinyUrlFunction, lambdaIntegrationOptions);
        createTinyUrlResource.addMethod(POST, createTinyUrlIntegration);

        new CfnOutput(this, "ApiDomain", CfnOutputProps.builder()
                .value(apiGateway.getUrl().split("/")[2])
                .build());

        new CfnOutput(this, "ApiStage", CfnOutputProps.builder()
                .value(apiGateway.getDeploymentStage().getStageName())
                .build());
    }

    private FunctionProps getLambdaFunctionProps(Map<String, String> lambdaEnvMap, String handler) {
        return FunctionProps.builder().code(Code.fromAsset("./asset/lambda-jar-with-dependencies.jar"))
                .handler(handler).runtime(Runtime.JAVA_8)
                .environment(lambdaEnvMap)
                .timeout(Duration.seconds(30))
                .memorySize(512).build();
    }

    private Table defineDynamoTable(String tableName, String partitionKey) {
        Attribute partitionKeyAttribute = Attribute.builder().name(partitionKey).type(AttributeType.STRING).build();
        TableProps tableProps = TableProps.builder().billingMode(BillingMode.PAY_PER_REQUEST)
                .tableName(tableName)
                .partitionKey(partitionKeyAttribute)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();
        Table dynamodbTable = new Table(this, tableName, tableProps);
        return dynamodbTable;
    }

    private Function defineLambdaFunction(Map<String, String> lambdaEnvMap, String lambdaFunctionName, String handlerPath) {
        Function lambdaFunction = new Function(this, lambdaFunctionName, getLambdaFunctionProps(lambdaEnvMap, handlerPath));
        return lambdaFunction;
    }

}
