package com.amazonaws.serverless.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;

import org.apache.commons.lang3.exception.ExceptionUtils;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;

import java.net.HttpURLConnection;
import java.util.Collections;

import static com.amazonaws.serverless.lambda.HandlerConstants.DYNAMO_TABLE_URL;
import static com.amazonaws.serverless.lambda.HandlerConstants.LOCATION;
import static com.amazonaws.serverless.lambda.HandlerConstants.TINY_URL;

public class GetUrlRequestHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    public GetUrlRequestHandler() {
        this(new UrlDataService());
    }
    GetUrlRequestHandler(final UrlDataService urlDataService) {
        this.urlDataService = urlDataService;
    }
    private final UrlDataService urlDataService;

    @Override
    public APIGatewayProxyResponseEvent handleRequest(final APIGatewayProxyRequestEvent input, final Context context) {
        LambdaLogger logger = context.getLogger();
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();

        try {
            final String shortId = input.getPathParameters()
                    .get(TINY_URL);
            logger.log("Looking for: " + shortId);
            GetItemResponse itemResponse = this.urlDataService.getLongUrl(shortId);
            if (!itemResponse.item()
                    .isEmpty()) {
                response.setStatusCode(HttpURLConnection.HTTP_MOVED_TEMP);
                response.setHeaders(Collections.singletonMap(LOCATION, itemResponse.item()
                        .get(DYNAMO_TABLE_URL)
                        .s()));
                return response;
            }
        } catch (Exception e) {
            String stacktrace = ExceptionUtils.getStackTrace(e);
            logger.log(stacktrace);
        }

        response.setStatusCode(HttpURLConnection.HTTP_NOT_FOUND);
        response.setBody("URL not found");
        return response;
    }

}
