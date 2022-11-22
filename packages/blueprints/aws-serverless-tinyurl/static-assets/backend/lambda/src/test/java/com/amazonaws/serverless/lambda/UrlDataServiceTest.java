package com.amazonaws.serverless.lambda;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.PutItemResponse;

import java.lang.reflect.Field;
import java.util.Collections;

import static com.amazonaws.serverless.lambda.HandlerConstants.DYNAMO_TABLE_ID;
import static com.amazonaws.serverless.lambda.HandlerConstants.DYNAMO_TABLE_URL;
import static com.amazonaws.serverless.lambda.TestConstants.LONG_URL_INPUT;
import static com.amazonaws.serverless.lambda.TestConstants.TINY_URL_ID;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class UrlDataServiceTest {

    private UrlDataService urlDataService;
    private DynamoDbClient client;
    private GetItemResponse getItemResponse;
    private PutItemResponse putItemResponse;

    @BeforeEach
    public void prepare() throws NoSuchFieldException, IllegalAccessException {
        urlDataService = new UrlDataService();
        client = mock(DynamoDbClient.class);

        Class urlDataServiceClass = urlDataService.getClass();
        Field f = urlDataServiceClass.getDeclaredField("dynamoDbClient");
        f.setAccessible(true);
        f.set(urlDataService, client);

        getItemResponse = GetItemResponse.builder()
                .item(Collections.singletonMap(DYNAMO_TABLE_URL, AttributeValue.builder()
                        .s(LONG_URL_INPUT)
                        .build()))
                .build();
        putItemResponse = PutItemResponse.builder()
                .build();
    }

    @Test
    public void verify_getLongUrl() {
        ArgumentCaptor<GetItemRequest> argument = ArgumentCaptor.forClass(GetItemRequest.class);
        when(client.getItem(any(GetItemRequest.class))).thenReturn(getItemResponse);

        getItemResponse = urlDataService.getLongUrl(TINY_URL_ID);

        verify(client, times(1)).getItem(argument.capture());
        Assertions.assertEquals(TINY_URL_ID, argument.getValue()
                .key()
                .get(DYNAMO_TABLE_ID)
                .s());
        Assertions.assertEquals(LONG_URL_INPUT, getItemResponse.item()
                .get(DYNAMO_TABLE_URL)
                .s());
    }

    @Test
    public void verify_saveLongUrl() {
        ArgumentCaptor<PutItemRequest> argument = ArgumentCaptor.forClass(PutItemRequest.class);
        when(client.putItem(any(PutItemRequest.class))).thenReturn(putItemResponse);
        PutItemResponse putItemResponse = urlDataService.saveLongUrl(TINY_URL_ID, LONG_URL_INPUT);

        verify(client, times(1)).putItem(argument.capture());
        Assertions.assertEquals(TINY_URL_ID, argument.getValue()
                .item()
                .get(DYNAMO_TABLE_ID)
                .s());

        Assertions.assertEquals(LONG_URL_INPUT, argument.getValue()
                .item()
                .get(DYNAMO_TABLE_URL)
                .s());
        Assertions.assertSame(putItemResponse, this.putItemResponse);
    }

}


