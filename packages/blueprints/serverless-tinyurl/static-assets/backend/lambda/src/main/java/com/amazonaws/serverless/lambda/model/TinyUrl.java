package com.amazonaws.serverless.lambda.model;

import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBHashKey;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBTable;

@DynamoDBTable(tableName = "tbl_tiny_url")
public class TinyUrl {

    @DynamoDBHashKey
    private String id;
    private String url;

    public TinyUrl() {

    }

    public TinyUrl(final String id, final String url) {
        this.id = id;
        this.url = url;
    }

    public void setId(final String id) {
        this.id = id;
    }

    public void setUrl(final String url) {
        this.url = url;
    }

    public String getId() {
        return id;
    }

    public String getUrl() {
        return url;
    }
}
