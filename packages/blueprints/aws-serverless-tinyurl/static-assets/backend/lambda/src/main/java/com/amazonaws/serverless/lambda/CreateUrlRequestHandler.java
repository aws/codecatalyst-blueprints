package com.amazonaws.serverless.lambda;

import com.amazonaws.serverless.lambda.dao.UrlDataService;
import com.amazonaws.serverless.lambda.model.TinyUrl;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;

import com.google.gson.Gson;
import org.apache.commons.lang3.exception.ExceptionUtils;

import java.math.BigInteger;
import java.net.HttpURLConnection;
import java.util.Collections;
import java.util.Map;

import static com.amazonaws.serverless.lambda.HandlerConstants.LONG_URL;
import static com.amazonaws.serverless.lambda.HandlerConstants.ORIGIN;
import static com.amazonaws.serverless.lambda.HandlerConstants.TINY_URL;

public class CreateUrlRequestHandler extends TinyUrlRequestHandler {

    public CreateUrlRequestHandler() {
        super();
    }

    CreateUrlRequestHandler(final UrlDataService urlDataService) {
        super(urlDataService);
    }

    private static final Gson GSON = new Gson();

    @Override
    public APIGatewayProxyResponseEvent handleRequest(final APIGatewayProxyRequestEvent input, final Context context) {
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        LambdaLogger logger = context.getLogger();
        logger.log(input.toString());
        try {
            Map<String, String> payload = GSON.fromJson(input.getBody(), Map.class);

            final String longUrl = payload.get(LONG_URL);
            if (longUrl == null || longUrl.isEmpty()) {
                throw new Exception("Input url is null or empty");
            }
            logger.log("Got URL: " + longUrl);
            String shortId = shortenUrl(longUrl);
            logger.log("Shortened to " + shortId);

            this.getUrlDataService().saveLongUrl(new TinyUrl(shortId, payload.get(LONG_URL)));
            logger.log(input.getHeaders()
                    .toString());

            String tinyUrl = input.getHeaders()
                    .get(ORIGIN);

            tinyUrl = tinyUrl.endsWith("/") ? tinyUrl.concat("t/")
                    .concat(shortId) : tinyUrl.concat("/t/")
                    .concat(shortId);

            String body = GSON.toJson(Collections.singletonMap(TINY_URL, tinyUrl));
            response.setBody(body);
            response.setStatusCode(HttpURLConnection.HTTP_CREATED);

            return response;
        } catch (Exception e) {
            String stacktrace = ExceptionUtils.getStackTrace(e);
            logger.log(stacktrace);
            response.setBody("Error occurred while generating the tiny URL");
            response.setStatusCode(HttpURLConnection.HTTP_INTERNAL_ERROR);
            return response;
        }
    }

    private String shortenUrl(final String url) {
        final int preHashRadixRepresentation = 16;
        final int xor = 0xff;
        final int exponent = 64;
        final int finalHashRadixRepresentation = 36;
        byte[] data = url.getBytes();
        BigInteger hash = new BigInteger("cbf29ce484222325", preHashRadixRepresentation);
        for (byte b : data) {
            hash = hash.xor(BigInteger.valueOf((int) b & xor));
            hash = hash.multiply(new BigInteger("100000001b3", preHashRadixRepresentation))
                    .mod(new BigInteger("2").pow(exponent));
        }
        return hash.toString(finalHashRadixRepresentation);
    }
}
