package com.amazonaws.serverless.lambda.dao;

import com.amazonaws.serverless.lambda.model.TinyUrl;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBMapper;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

import static com.amazonaws.serverless.lambda.TestConstants.LONG_URL_INPUT;
import static com.amazonaws.serverless.lambda.TestConstants.TINY_URL_ID;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UrlDataServiceTest {
    @Mock
    private DynamoDBMapper dynamoDBMapper;
    private UrlDataService urlDataService;

    @BeforeEach
    public void prepare() throws ReflectiveOperationException {
        urlDataService = new UrlDataService("us-west-2");
        Class urlDataServiceClass = urlDataService.getClass();
        Field f = urlDataServiceClass.getDeclaredField("dynamoDBMapper");
        f.setAccessible(true);
        f.set(urlDataService, dynamoDBMapper);
    }

    @Test
    public void verify_getLongUrl() {
        when(dynamoDBMapper.load(any(TinyUrl.class))).thenReturn(new TinyUrl(TINY_URL_ID, LONG_URL_INPUT));
        TinyUrl tinyUrl = urlDataService.getLongUrl(TINY_URL_ID);
        Assertions.assertEquals(TINY_URL_ID, tinyUrl.getId());
        Assertions.assertEquals(LONG_URL_INPUT, tinyUrl.getUrl());
    }

    @Test
    public void verify_saveLongUrl() {
        doNothing().when(dynamoDBMapper)
                .save(any(TinyUrl.class));
        urlDataService.saveLongUrl(new TinyUrl(TINY_URL_ID, LONG_URL_INPUT));
        verify(dynamoDBMapper, times(1)).save(any(TinyUrl.class));
    }
}


