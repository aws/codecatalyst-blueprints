package com.amazonaws.serverless.lambda;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.util.Collections;
import java.util.HashMap;

import static com.amazonaws.serverless.lambda.HandlerConstants.*;
import static com.amazonaws.serverless.lambda.HandlerConstants.DYNAMO_TABLE_URL;
import static software.amazon.awssdk.services.dynamodb.DynamoDbClient.create;

public class UrlDataService {
    private DynamoDbClient dynamoDbClient;

    private DynamoDbClient getDynamoDbClient() {
        if (this.dynamoDbClient == null) {
            this.dynamoDbClient = create();
        }
        return this.dynamoDbClient;
    }

    public void setDynamoDbClient(DynamoDbClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
    }

    public GetItemResponse getLongUrl(final String shortId) {
            GetItemResponse itemResponse = this.getDynamoDbClient().getItem(GetItemRequest.builder()
                    .tableName(System.getenv(TABLE_NAME))
                    .key(Collections.singletonMap(DYNAMO_TABLE_ID, AttributeValue.builder()
                            .s(shortId).build())).build());
            return itemResponse;
    }

    public PutItemResponse saveLongUrl(final String shortId, final String longUrl) {
        HashMap<String, AttributeValue> item = new HashMap<String, AttributeValue>();
        item.put(DYNAMO_TABLE_ID, AttributeValue.builder().s(shortId).build());
        item.put(DYNAMO_TABLE_URL, AttributeValue.builder().s(longUrl).build());
        PutItemRequest putItemRequest = PutItemRequest.builder()
                .tableName(System.getenv(TABLE_NAME))
                .item(item).build();
        return this.getDynamoDbClient().putItem(putItemRequest);
    }
}
