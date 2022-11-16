package com.amazonaws.serverless.lambda;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Collections;
import java.util.UUID;

import static com.amazonaws.serverless.lambda.HandlerConstants.DYNAMO_TABLE_ID;
import static com.amazonaws.serverless.lambda.HandlerConstants.DYNAMO_TABLE_URL;
import static com.amazonaws.serverless.lambda.TestConstants.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class UrlDataServiceTest {

    private UrlDataService urlDataService;
    private DynamoDbClient client;
    private GetItemResponse getItemResponse;
    private PutItemResponse putItemResponse;

    @Before public void prepare(){
        urlDataService = new UrlDataService();
        client = mock(DynamoDbClient.class);
        urlDataService.setDynamoDbClient(client);
        getItemResponse = GetItemResponse.builder()
                .item(Collections.singletonMap(DYNAMO_TABLE_URL, AttributeValue.builder().s(LONG_URL_INPUT).build()))
                .build();
        putItemResponse = PutItemResponse.builder().build();
    }
    @Test
    public void getLongUrl() {
        ArgumentCaptor<GetItemRequest> argument = ArgumentCaptor.forClass(GetItemRequest.class);
        when(client.getItem(any(GetItemRequest.class))).thenReturn(getItemResponse);

        getItemResponse = urlDataService.getLongUrl(TINY_URL_ID);

        verify(client, times(1)).getItem(argument.capture());
        Assert.assertEquals(TINY_URL_ID, argument.getValue().key().get(DYNAMO_TABLE_ID).s());
        Assert.assertEquals(LONG_URL_INPUT, getItemResponse.item().get(DYNAMO_TABLE_URL).s());
    }

    @Test
    public void saveLongUrl() {
        ArgumentCaptor<PutItemRequest> argument = ArgumentCaptor.forClass(PutItemRequest.class);
        when(client.putItem(any(PutItemRequest.class))).thenReturn(putItemResponse);
        PutItemResponse putItemResponse = urlDataService.saveLongUrl(TINY_URL_ID, LONG_URL_INPUT);

        urlDataService.setDynamoDbClient(client);

        verify(client, times(1)).putItem(argument.capture());
        Assert.assertEquals(TINY_URL_ID, argument.getValue().item().get(DYNAMO_TABLE_ID).s());
        Assert.assertEquals(LONG_URL_INPUT, argument.getValue().item().get(DYNAMO_TABLE_URL).s());
        Assert.assertSame(putItemResponse, this.putItemResponse);
    }

}


