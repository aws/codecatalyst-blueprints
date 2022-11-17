package com.amazonaws.serverless.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;

import com.google.gson.Gson;
import org.apache.commons.lang3.exception.ExceptionUtils;

import java.math.BigInteger;
import java.util.Collections;
import java.util.Map;

import static com.amazonaws.serverless.lambda.HandlerConstants.LONG_URL;
import static com.amazonaws.serverless.lambda.HandlerConstants.ORIGIN;
import static com.amazonaws.serverless.lambda.HandlerConstants.TINY_URL;


public class CreateUrlRequestHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

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

    private static final Gson gson = new Gson();

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent input, Context context) {
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        LambdaLogger logger = context.getLogger();
        try {
            Map<String, String> payload = gson.fromJson(input.getBody(), Map.class);

            logger.log("Got URL: " + payload.get(LONG_URL));
            String shortId = shortenUrl(payload.get(LONG_URL));
            logger.log("Shortened to " + shortId);

            this.getUrlDataService()
                    .saveLongUrl(shortId, payload.get(LONG_URL));
            logger.log(input.getHeaders()
                    .toString());

            String tinyUrl = input.getHeaders()
                    .get(ORIGIN);
            tinyUrl = tinyUrl.endsWith("/") ? tinyUrl.concat("t/")
                    .concat(shortId) : tinyUrl.concat("/t/")
                    .concat(shortId);

            String body = gson.toJson(Collections.singletonMap(TINY_URL, tinyUrl));
            response.setBody(body);
            response.setStatusCode(201);

            return response;
        } catch (Exception e) {
            String stacktrace = ExceptionUtils.getStackTrace(e);
            logger.log(stacktrace);
            response.setBody("Error occurred while generating the tiny URL");
            response.setStatusCode(500);
            return response;
        }


    }

    private String shortenUrl(String url) {
        byte[] data = url.getBytes();
        BigInteger hash = new BigInteger("cbf29ce484222325", 16);
        for (byte b : data) {
            hash = hash.xor(BigInteger.valueOf((int) b & 0xff));
            hash = hash.multiply(new BigInteger("100000001b3", 16))
                    .mod(new BigInteger("2").pow(64));
        }
        return hash.toString(36);
    }
}
