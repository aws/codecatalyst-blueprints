#!/usr/bin/env node
import 'source-map-support/register';
import { App, Aspects } from 'aws-cdk-lib';
import { AppStack } from '../lib/app-stack';
import {
  AwsSolutionsChecks,
  // HIPAASecurityChecks,
  // PCIDSS321Checks,
  // NIST80053R4Checks,
  // NIST80053R5Checks
} from 'cdk-nag';

const app = new App();
new AppStack(app, '{{stackName}}', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

// Simple rule informational messages
Aspects.of(app).add(new AwsSolutionsChecks());
// Aspects.of(app).add(new HIPAASecurityChecks());
// Aspects.of(app).add(new PCIDSS321Checks());
// Aspects.of(app).add(new NIST80053R4Checks());
// Aspects.of(app).add(new NIST80053R5Checks());

// Additional explanations on the purpose of triggered rules
// Aspects.of(stack).add(new AwsSolutionsChecks({ verbose: true }));
// Aspects.of(stack).add(new HIPAASecurityChecks({ verbose: true }));
// Aspects.of(stack).add(new PCIDSS321Checks({ verbose: true }));
// Aspects.of(stack).add(new NIST80053R4Checks({ verbose: true }));
// Aspects.of(stack).add(new NIST80053R5Checks({ verbose: true }));