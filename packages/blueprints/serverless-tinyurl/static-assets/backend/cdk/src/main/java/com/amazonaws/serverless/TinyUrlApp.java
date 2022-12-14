package com.amazonaws.serverless;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;

public class TinyUrlApp {

    private static Environment makeEnv(final String account, final String region) {
        return Environment.builder()
                .account(account)
                .region(region)
                .build();
    }

    public static void main(final String[] args) {
        App app = new App();
        Environment environment = makeEnv("{{bp_aws_account}}", "{{bp_aws_region}}");
        new TinyUrlAppStack(app, "{{backend_stack_name}}", StackProps.builder()
                .env(environment)
                .build());

        app.synth();
    }

}
