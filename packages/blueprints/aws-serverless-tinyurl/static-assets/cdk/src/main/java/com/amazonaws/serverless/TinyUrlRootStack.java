package com.amazonaws.serverless;

import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Stack;
import software.constructs.Construct;

public class TinyUrlRootStack extends Stack {
    TinyUrlAppStack tinyUrlAppStack;
    TinyUrlCanaryStack tinyUrlCanaryStack;

    TinyUrlRootStack(final Construct parent, final String stackName) {
        super(parent, stackName);

        this.tinyUrlAppStack = new TinyUrlAppStack(this, stackName);
        CfnOutput.Builder.create(this, "CloudFormationStackNameApplication")
                .description("CloudFormation stack for Tiny URL application")
                .value(tinyUrlAppStack.getStackName())
                .exportName("CloudFormationStackNameApplication")
                .build();
        this.tinyUrlCanaryStack = new TinyUrlCanaryStack(this, stackName + "Canary");
        CfnOutput.Builder.create(this, "CloudFormationStackNameApplicationCanary")
                .description("CloudFormation stack for canary to test Tiny URL application")
                .value(tinyUrlCanaryStack.getStackName())
                .exportName("CloudFormationStackNameApplicationCanary")
                .build();
        this.tinyUrlCanaryStack.addDependency(this.tinyUrlAppStack);
    }
}
