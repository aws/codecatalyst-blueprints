package com.amazonaws.serverless.lambda;


import com.amazonaws.serverless.lambda.dao.UrlDataService;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;

import com.google.gson.Gson;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.net.HttpURLConnection;
import java.util.Collections;
import java.util.Map;

import static com.amazonaws.serverless.lambda.TestConstants.LONG_URL;
import static com.amazonaws.serverless.lambda.TestConstants.LONG_URL_INPUT;
import static com.amazonaws.serverless.lambda.TestConstants.ORIGIN;
import static com.amazonaws.serverless.lambda.TestConstants.ORIGIN_URL;
import static com.amazonaws.serverless.lambda.TestConstants.TINY_URL;
import static com.amazonaws.serverless.lambda.TestConstants.TINY_URL_OUTPUT;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class CreateUrlRequestHandlerTest {
    @Mock
    private UrlDataService urlDataService;
    @Mock
    private Context context;
    @Mock
    private LambdaLogger logger;
    private CreateUrlRequestHandler handler;
    private APIGatewayProxyRequestEvent request;
    private static final Gson GSON = new Gson();

    @BeforeEach
    public void prepare() {
        handler = new CreateUrlRequestHandler(urlDataService);
        request = new APIGatewayProxyRequestEvent();
        when(context.getLogger()).thenReturn(logger);
    }

    @Test
    public void verify_handleRequest_with_input() {
        String body = GSON.toJson(Collections.singletonMap(LONG_URL, LONG_URL_INPUT));
        request.setBody(body);
        request.setHeaders(Collections.singletonMap(ORIGIN, ORIGIN_URL));
        APIGatewayProxyResponseEvent response = handler.handleRequest(request, context);
        Map data = GSON.fromJson(response.getBody(), Map.class);
        Assertions.assertEquals(TINY_URL_OUTPUT, data.get(TINY_URL));
    }

    @Test
    public void verify_handleRequest_with_null_input() {
        String body = GSON.toJson(Collections.singletonMap(LONG_URL, null));
        request.setBody(body);
        request.setHeaders(Collections.singletonMap(ORIGIN, ORIGIN_URL));
        APIGatewayProxyResponseEvent response = handler.handleRequest(request, context);
        Assertions.assertEquals(response.getStatusCode(), HttpURLConnection.HTTP_INTERNAL_ERROR);
        Assertions.assertEquals(response.getBody(), "Error occurred while generating the tiny URL");
    }

    @Test
    public void verify_handleRequest_with_empty_input() {
        String body = GSON.toJson(Collections.singletonMap(LONG_URL, ""));
        request.setBody(body);
        request.setHeaders(Collections.singletonMap(ORIGIN, ORIGIN_URL));
        APIGatewayProxyResponseEvent response = handler.handleRequest(request, context);
        Assertions.assertEquals(response.getStatusCode(), HttpURLConnection.HTTP_INTERNAL_ERROR);
        Assertions.assertEquals(response.getBody(), "Error occurred while generating the tiny URL");
    }
}
