package com.amazonaws.serverless.lambda;

import com.amazonaws.serverless.lambda.dao.UrlDataService;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;

public abstract class TinyUrlRequestHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    public UrlDataService getUrlDataService() {
        return urlDataService;
    }

    private final UrlDataService urlDataService;

    public TinyUrlRequestHandler() {
        this(new UrlDataService(System.getenv("AWS_REGION")));
    }

    TinyUrlRequestHandler(final UrlDataService urlDataService) {
        this.urlDataService = urlDataService;
    }
}
