package com.amazonaws.serverless;


import org.junit.jupiter.api.Test;
import software.amazon.awscdk.App;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;

public class TinyUrlStackTest {

    @Test
    public void verify_app_synth() {
       App app = new App();
       TinyUrlAppStack stack = new TinyUrlAppStack(app, "TestStack", StackProps.builder().build());

       Template template = Template.fromStack(stack);

       template.resourceCountIs("AWS::Lambda::Function", 2);

       template.hasResource("AWS::DynamoDB::Table", 1);

       template.hasResource("AWS::ApiGateway::RestApi", 1);
    }

}
