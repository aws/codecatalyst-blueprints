package com.amazonaws.serverless;


import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import software.amazon.awscdk.App;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;

import java.io.File;

public class TinyUrlStackTest {

    private static final String TEST_DEPENDENCY_JAR = "./asset/lambda-jar-with-dependencies.jar";
    @BeforeAll
    public static void prepare(){
        File f = new File(TEST_DEPENDENCY_JAR);
        f.getParentFile().mkdirs();
        try {
            f.createNewFile();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
    @Test
    public void verify_app_synth() {
        App app = new App();
        TinyUrlAppStack stack = new TinyUrlAppStack(app, "TestStack", StackProps.builder().build());

        Template template = Template.fromStack(stack);

        template.resourceCountIs("AWS::Lambda::Function", 2);

        template.hasResource("AWS::DynamoDB::Table", 1);

        template.hasResource("AWS::ApiGateway::RestApi", 1);
    }

    @AfterAll
    public static void teardown(){
        File f = new File(TEST_DEPENDENCY_JAR);
        try {
            f.delete();
            f.getParentFile().delete();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
