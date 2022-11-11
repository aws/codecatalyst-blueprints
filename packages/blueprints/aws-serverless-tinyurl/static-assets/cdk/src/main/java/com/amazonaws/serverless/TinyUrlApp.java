package com.amazonaws.serverless;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;

public class TinyUrlApp {

    static Environment makeEnv(String account, String region) {
        return Environment.builder()
                .account(account)
                .region(region)
                .build();
    }

    public static void main(String[] args) {
        App app = new App();
        new TinyUrlRootStack(app,"{{stackName}}");
        app.synth();
    }
}
