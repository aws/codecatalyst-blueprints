package com.amazonaws.serverless;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;

public class TinyUrlApp {

    static Environment makeEnv(String account, String region) {
        return Environment.builder()
                .account(account)
                .region(region)
                .build();
    }

    public static void main(String[] args) {
        App app = new App();
       Environment environment = makeEnv("381171000587", "us-west-2");
       new TinyUrlAppStack(app, "Backend33nd5", StackProps.builder()
               .env(environment).build());

        // Environment environment = makeEnv("XXXXXXXXX", "XXXXXX");
        // new TinyUrlRootStack(app, "TinyUrl1", StackProps.builder()
        //         .env(environment).build());

        app.synth();
    }

}
