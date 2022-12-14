package com.amazonaws.serverless.lambda.dao;

import com.amazonaws.serverless.lambda.model.TinyUrl;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBMapper;

public class UrlDataService {

    public UrlDataService(final String awsRegion) {
        dynamoDBMapper = new DynamoDBMapper(AmazonDynamoDBClientBuilder.standard()
                .withRegion(awsRegion)
                .build());
    }

    private DynamoDBMapper dynamoDBMapper;

    public TinyUrl getLongUrl(final String shortId) {
        TinyUrl input = new TinyUrl();
        input.setId(shortId);
        TinyUrl result = dynamoDBMapper.load(input);
        return result;
    }

    /*
    To save the long URL input for the generated short URL
     */
    public void saveLongUrl(final TinyUrl tinyUrl) {
        dynamoDBMapper.save(tinyUrl);
    }
}
