package com.amazonaws.serverless.lambda;

import com.amazonaws.serverless.lambda.dao.UrlDataService;
import com.amazonaws.serverless.lambda.model.TinyUrl;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.net.HttpURLConnection;
import java.util.Collections;

import static com.amazonaws.serverless.lambda.TestConstants.LONG_URL_INPUT;
import static com.amazonaws.serverless.lambda.TestConstants.TINY_URL;
import static com.amazonaws.serverless.lambda.TestConstants.TINY_URL_ID;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.hasEntry;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class GetUrlRequestHandlerTest {
    @Mock
    private UrlDataService urlDataService;
    @Mock
    private Context context;
    @Mock
    private LambdaLogger logger;
    private GetUrlRequestHandler handler;
    private APIGatewayProxyRequestEvent request;

    @BeforeEach
    public void prepare() {
        handler = new GetUrlRequestHandler(urlDataService);
        request = new APIGatewayProxyRequestEvent();
        when(context.getLogger()).thenReturn(logger);
    }

    @Test
    public void verify_handleRequest_with_valid_input() {
        request.setPathParameters(Collections.singletonMap(TINY_URL, TINY_URL_ID));
        when(urlDataService.getLongUrl(any(String.class))).thenReturn(new TinyUrl(TINY_URL_ID, LONG_URL_INPUT));
        APIGatewayProxyResponseEvent response = handler.handleRequest(request, context);
        assertThat(response.getHeaders(), hasEntry("Location", LONG_URL_INPUT));
    }

    @Test
    public void verify_handleRequest_with_invalid_input() {
        request.setPathParameters(Collections.singletonMap(TINY_URL, TINY_URL_ID));
        when(urlDataService.getLongUrl(any(String.class))).thenReturn(null);
        APIGatewayProxyResponseEvent response = handler.handleRequest(request, context);
        Assertions.assertEquals(response.getStatusCode(), HttpURLConnection.HTTP_NOT_FOUND);
        Assertions.assertEquals(response.getBody(), "URL not found");
    }

    @Test
    public void verify_handleRequest_and_raise_exception() {
        APIGatewayProxyResponseEvent response = handler.handleRequest(request, context);
        Assertions.assertEquals(response.getStatusCode(), HttpURLConnection.HTTP_NOT_FOUND);
        Assertions.assertEquals(response.getBody(), "URL not found");
    }

}


