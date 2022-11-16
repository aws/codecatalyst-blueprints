package com.amazonaws.serverless.lambda;


import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.gson.Gson;
import org.junit.Assert;
import org.junit.Test;

import java.util.Collections;
import java.util.Map;

import static com.amazonaws.serverless.lambda.TestConstants.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
public class CreateUrlRequestHandlerTest {

    @Test
    public void handleRequest() {
        CreateUrlRequestHandler handler = new CreateUrlRequestHandler();
        UrlDataService urlDataService = mock(UrlDataService.class);
        handler.setUrlDataService(urlDataService);
        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent();
        Gson gson = new Gson();
        String body = gson.toJson(Collections.singletonMap(LONG_URL, LONG_URL_INPUT));
        request.setBody(body);
        request.setHeaders(Collections.singletonMap(ORIGIN, ORIGIN_URL));
        APIGatewayProxyResponseEvent response = handler.handleRequest(request, getContext());
        Map data = gson.fromJson(response.getBody(), Map.class);
        Assert.assertEquals("Tiny URL mismatch", TINY_URL_OUTPUT, data.get(TINY_URL));
    }

    private Context getContext() {
        Context context = mock(Context.class);
        when(context.getLogger()).thenReturn(mock(LambdaLogger.class));
        return context;
    }
}
