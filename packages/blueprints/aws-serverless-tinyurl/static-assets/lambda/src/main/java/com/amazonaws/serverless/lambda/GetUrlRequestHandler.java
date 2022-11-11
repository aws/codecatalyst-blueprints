package com.amazonaws.serverless.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;

import java.util.Collections;

import static com.amazonaws.serverless.lambda.HandlerConstants.*;

public class GetUrlRequestHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private UrlDataService urlDataService;

    private UrlDataService getUrlDataService() {
        if (this.urlDataService == null) {
            this.urlDataService = new UrlDataService();
        }
        return this.urlDataService;
    }

    public void setUrlDataService(UrlDataService urlDataService) {
        this.urlDataService = urlDataService;
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent input, Context context) {
        LambdaLogger logger = context.getLogger();
        String shortId = input.getPathParameters().get(TINY_URL);
        logger.log("Looking for: " + shortId);
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();

        try {
            GetItemResponse itemResponse = this.getUrlDataService().getLongUrl(shortId);
            if (!itemResponse.item().isEmpty()) {
                response.setStatusCode(302);
                response.setHeaders(Collections.singletonMap(LOCATION, itemResponse.item().get(DYNAMO_TABLE_URL).s()));
                return response;
            }
        } catch (Exception e) {
            logger.log(e.getMessage());
        }

        response.setStatusCode(404);
        response.setBody("Not found");
        return response;
    }

}
