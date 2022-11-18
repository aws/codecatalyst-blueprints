package com.amazonaws.serverless.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;

import com.google.gson.Gson;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;

import java.lang.reflect.Field;
import java.net.HttpURLConnection;
import java.util.Collections;

import static com.amazonaws.serverless.lambda.TestConstants.DYNAMO_TABLE_URL;
import static com.amazonaws.serverless.lambda.TestConstants.LONG_URL_INPUT;
import static com.amazonaws.serverless.lambda.TestConstants.TINY_URL;
import static com.amazonaws.serverless.lambda.TestConstants.TINY_URL_ID;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.hasEntry;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class GetUrlRequestHandlerTest {


    GetUrlRequestHandler handler;
    UrlDataService urlDataService;
    APIGatewayProxyRequestEvent request;
    Gson gson;
    Context context;


    @BeforeEach
    public void prepare() throws NoSuchFieldException, IllegalAccessException {
        urlDataService = mock(UrlDataService.class);
        handler = new GetUrlRequestHandler();

        Class clazz = handler.getClass();
        Field urlDataServiceField = clazz.getDeclaredField("urlDataService");
        urlDataServiceField.setAccessible(true);
        urlDataServiceField.set(handler, urlDataService);

        request = new APIGatewayProxyRequestEvent();
        gson = new Gson();
        context = mock(Context.class);
        when(context.getLogger()).thenReturn(mock(LambdaLogger.class));
    }

    @Test
    public void verify_handleRequest_with_valid_input() {
        request.setPathParameters(Collections.singletonMap(TINY_URL, TINY_URL_ID));
        GetItemResponse getItemResponse = GetItemResponse.builder()
                .item(Collections.singletonMap(DYNAMO_TABLE_URL, AttributeValue.builder()
                        .s(LONG_URL_INPUT)
                        .build()))
                .build();

        when(urlDataService.getLongUrl(any(String.class))).thenReturn(getItemResponse);
        APIGatewayProxyResponseEvent response = handler.handleRequest(request, context);

        assertThat(response.getHeaders(), hasEntry("Location", LONG_URL_INPUT));
    }

    @Test
    public void verify_handleRequest_with_invalid_input() {
        request.setPathParameters(Collections.singletonMap(TINY_URL, TINY_URL_ID));
        GetItemResponse getItemResponse = GetItemResponse.builder()
                .item(null)
                .build();
        when(urlDataService.getLongUrl(any(String.class))).thenReturn(getItemResponse);

        APIGatewayProxyResponseEvent response = handler.handleRequest(request, context);

        Assertions.assertEquals(response.getStatusCode(), HttpURLConnection.HTTP_NOT_FOUND);
        Assertions.assertEquals(response.getBody(), "URL not found");
    }

}


