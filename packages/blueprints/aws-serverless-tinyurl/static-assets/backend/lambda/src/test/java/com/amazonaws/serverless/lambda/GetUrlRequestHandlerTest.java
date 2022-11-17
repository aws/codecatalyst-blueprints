package com.amazonaws.serverless.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;

import org.junit.Test;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;

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

    @Test
    public void handleRequest() {
        GetUrlRequestHandler handler = new GetUrlRequestHandler();
        UrlDataService urlDataService = mock(UrlDataService.class);
        handler.setUrlDataService(urlDataService);
        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent();
        request.setPathParameters(Collections.singletonMap(TINY_URL, TINY_URL_ID));
        GetItemResponse getItemResponse = GetItemResponse.builder()
                .item(Collections.singletonMap(DYNAMO_TABLE_URL, AttributeValue.builder()
                        .s(LONG_URL_INPUT)
                        .build()))
                .build();
        when(urlDataService.getLongUrl(any(String.class))).thenReturn(getItemResponse);
        APIGatewayProxyResponseEvent response = handler.handleRequest(request, getContext());
        assertThat(response.getHeaders(), hasEntry("Location", LONG_URL_INPUT));
    }

    private Context getContext() {
        Context context = mock(Context.class);
        when(context.getLogger()).thenReturn(mock(LambdaLogger.class));
        return context;
    }
}


