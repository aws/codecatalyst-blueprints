#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ChatbotGenAiCdkStack } from "../lib/chatbot-genai-cdk-stack";
import { FrontendWafStack } from "../lib/frontend-waf-stack";

const app = new cdk.App();

const ALLOWED_IP_V4_ADDRESS_RANGES: string[] = app.node.tryGetContext(
  "allowedIpV4AddressRanges"
);
const ALLOWED_IP_V6_ADDRESS_RANGES: string[] = app.node.tryGetContext(
  "allowedIpV6AddressRanges"
);
const ENABLE_USAGE_ANALYSIS: boolean = app.node.tryGetContext(
  "enableUsageAnalysis"
);

// WAF for frontend
// 2023/9: Currently, the WAF for CloudFront needs to be created in the North America region (us-east-1), so the stacks are separated
// https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-wafv2-webacl.html
const waf = new FrontendWafStack(app, `Waf${app.node.tryGetContext('stackName')}`, {
  env: {
    region: "us-east-1",
  },
  allowedIpV4AddressRanges: ALLOWED_IP_V4_ADDRESS_RANGES,
  allowedIpV6AddressRanges: ALLOWED_IP_V6_ADDRESS_RANGES,
});

new ChatbotGenAiCdkStack(app, app.node.tryGetContext('stackName'), {
  env: {
    region: app.node.tryGetContext('region'),
  },
  crossRegionReferences: true,
  webAclId: waf.webAclArn.value,
  bedrockRegion: app.node.tryGetContext('bedrockRegion'),
  enableUsageAnalysis: ENABLE_USAGE_ANALYSIS,
});
