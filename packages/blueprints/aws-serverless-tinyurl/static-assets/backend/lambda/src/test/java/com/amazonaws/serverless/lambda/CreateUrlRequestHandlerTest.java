package com.amazonaws.serverless.lambda;


import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;

import com.google.gson.Gson;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.HttpURLConnection;
import java.util.Collections;
import java.util.Map;

import static com.amazonaws.serverless.lambda.TestConstants.LONG_URL;
import static com.amazonaws.serverless.lambda.TestConstants.LONG_URL_INPUT;
import static com.amazonaws.serverless.lambda.TestConstants.ORIGIN;
import static com.amazonaws.serverless.lambda.TestConstants.ORIGIN_URL;
import static com.amazonaws.serverless.lambda.TestConstants.TINY_URL;
import static com.amazonaws.serverless.lambda.TestConstants.TINY_URL_ID;
import static com.amazonaws.serverless.lambda.TestConstants.TINY_URL_OUTPUT;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class CreateUrlRequestHandlerTest {

    CreateUrlRequestHandler handler;
    UrlDataService urlDataService;
    APIGatewayProxyRequestEvent request;
    Gson gson;
    Context context;

    @BeforeEach
    public void prepare() throws NoSuchFieldException, IllegalAccessException {
        urlDataService = mock(UrlDataService.class);
        handler = new CreateUrlRequestHandler(urlDataService);
        request = new APIGatewayProxyRequestEvent();
        gson = new Gson();
        context = mock(Context.class);
        when(context.getLogger()).thenReturn(mock(LambdaLogger.class));
    }

    @Test
    public void verify_handleRequest_with_input() {
        String body = gson.toJson(Collections.singletonMap(LONG_URL, LONG_URL_INPUT));
        request.setBody(body);
        request.setHeaders(Collections.singletonMap(ORIGIN, ORIGIN_URL));
        APIGatewayProxyResponseEvent response = handler.handleRequest(request, context);
        Map data = gson.fromJson(response.getBody(), Map.class);
        Assertions.assertEquals(TINY_URL_OUTPUT, data.get(TINY_URL));
    }

    @Test
    public void verify_handleRequest_with_null_input() {
        request.setBody(null);
        request.setHeaders(Collections.singletonMap(ORIGIN, ORIGIN_URL));
        APIGatewayProxyResponseEvent response = handler.handleRequest(request, context);
        Assertions.assertEquals(response.getStatusCode(), HttpURLConnection.HTTP_INTERNAL_ERROR);
        Assertions.assertEquals(response.getBody(), "Error occurred while generating the tiny URL");
    }

    @Test
    public void verify_shortenUrl_with_valid_input() throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
        Method shortenUrlMethod = handler.getClass()
                .getDeclaredMethod("shortenUrl", String.class);
        shortenUrlMethod.setAccessible(true);
        String tinyUrl = (String) shortenUrlMethod.invoke(handler, LONG_URL_INPUT);
        Assertions.assertEquals(TINY_URL_ID, tinyUrl);
    }
}
