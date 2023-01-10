package com.amazonaws.serverless.lambda;

import com.amazonaws.serverless.lambda.dao.UrlDataService;
import com.amazonaws.serverless.lambda.model.TinyUrl;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;

import org.apache.commons.lang3.exception.ExceptionUtils;

import java.net.HttpURLConnection;
import java.util.Collections;

import static com.amazonaws.serverless.lambda.HandlerConstants.LOCATION;
import static com.amazonaws.serverless.lambda.HandlerConstants.TINY_URL;

public class GetUrlRequestHandler extends TinyUrlRequestHandler {

    public GetUrlRequestHandler() {
        super();
    }

    GetUrlRequestHandler(final UrlDataService urlDataService) {
        super(urlDataService);
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(final APIGatewayProxyRequestEvent input, final Context context) {
        LambdaLogger logger = context.getLogger();
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();

        try {
            final String shortId = input.getPathParameters()
                    .get(TINY_URL);
            logger.log("Looking for: " + shortId);
            TinyUrl tinyUrlResponse = this.getUrlDataService().getLongUrl(shortId);
            if (tinyUrlResponse != null) {
                response.setStatusCode(HttpURLConnection.HTTP_MOVED_TEMP);
                response.setHeaders(Collections.singletonMap(LOCATION, tinyUrlResponse.getUrl()));
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
