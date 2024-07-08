#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ChatbotGenAiCdkStack } from "../lib/chatbot-genai-cdk-stack";
import { FrontendWafStack } from "../lib/frontend-waf-stack";
import { TIdentityProvider } from "../lib/utils/identity-provider";
import { CronScheduleProps } from "../lib/utils/cron-schedule";

const app = new cdk.App();

// Allowed IP address ranges for this app itself
const ALLOWED_IP_V4_ADDRESS_RANGES: string[] = app.node.tryGetContext(
  "allowedIpV4AddressRanges"
);
const ALLOWED_IP_V6_ADDRESS_RANGES: string[] = app.node.tryGetContext(
  "allowedIpV6AddressRanges"
);

// Allowed IP address ranges for the published API
const PUBLISHED_API_ALLOWED_IP_V4_ADDRESS_RANGES: string[] =
  app.node.tryGetContext("publishedApiAllowedIpV4AddressRanges");
const PUBLISHED_API_ALLOWED_IP_V6_ADDRESS_RANGES: string[] =
  app.node.tryGetContext("publishedApiAllowedIpV6AddressRanges");

const ALLOWED_SIGN_UP_EMAIL_DOMAINS: string[] =
  app.node.tryGetContext('allowedSignUpEmailDomains');
const IDENTITY_PROVIDERS: TIdentityProvider[] =
  app.node.tryGetContext("identityProviders");
const USER_POOL_DOMAIN_PREFIX: string = app.node.tryGetContext(
  "userPoolDomainPrefix"
);
const AUTO_JOIN_USER_GROUPS: string[] = app.node.tryGetContext(
  "autoJoinUserGroups"
);

const RDS_SCHEDULES: CronScheduleProps = app.node.tryGetContext("rdbSchedules");
const ENABLE_MISTRAL: boolean = app.node.tryGetContext("enableMistral");
const SELF_SIGN_UP_ENABLED: boolean = app.node.tryGetContext("selfSignUpEnabled");

// container size of embedding ecs tasks
const EMBEDDING_CONTAINER_VCPU: number = app.node.tryGetContext("embeddingContainerVcpu");
const EMBEDDING_CONTAINER_MEMORY: number = app.node.tryGetContext("embeddingContainerMemory");

// WAF for frontend
// 2023/9: Currently, the WAF for CloudFront needs to be created in the North America region (us-east-1), so the stacks are separated
// https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-wafv2-webacl.html
const waf = new FrontendWafStack(app, `Waf${app.node.tryGetContext('stackName')}`, {
  env: {
    region: "us-east-1",
  },
  allowedIpV4AddressRanges: ALLOWED_IP_V4_ADDRESS_RANGES,
  allowedIpV6AddressRanges: ALLOWED_IP_V6_ADDRESS_RANGES,
  aclName: app.node.tryGetContext('webAclName') ?? 'FrontendWebAcl',
});

const chat = new ChatbotGenAiCdkStack(app, app.node.tryGetContext('stackName'), {
  env: {
    region: app.node.tryGetContext('region'),
  },
  crossRegionReferences: true,
  webAclId: waf.webAclArn.value,
  identityProviders: IDENTITY_PROVIDERS,
  userPoolDomainPrefix: USER_POOL_DOMAIN_PREFIX,
  bedrockRegion: app.node.tryGetContext('bedrockRegion'),
  publishedApiAllowedIpV4AddressRanges:
    PUBLISHED_API_ALLOWED_IP_V4_ADDRESS_RANGES,
  publishedApiAllowedIpV6AddressRanges:
    PUBLISHED_API_ALLOWED_IP_V6_ADDRESS_RANGES,
  allowedSignUpEmailDomains:
    ALLOWED_SIGN_UP_EMAIL_DOMAINS,
  autoJoinUserGroups: AUTO_JOIN_USER_GROUPS,
  rdsSchedules: RDS_SCHEDULES,
  enableMistral: ENABLE_MISTRAL,
  embeddingContainerVcpu: EMBEDDING_CONTAINER_VCPU,
  embeddingContainerMemory: EMBEDDING_CONTAINER_MEMORY,
  selfSignUpEnabled: SELF_SIGN_UP_ENABLED,
});
chat.addDependency(waf);
