/**
 * CloudFront does not support access log delivery in the following regions
 * @see https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/AccessLogs.html#access-logs-choosing-s3-bucket
 */
export const CF_SKIP_ACCESS_LOGGING_REGIONS = [
  'af-south-1',
  'ap-east-1',
  'ap-south-2',
  'ap-southeast-3',
  'ap-southeast-4',
  'ca-west-1',
  'eu-south-1',
  'eu-south-2',
  'eu-central-2',
  'il-central-1',
  'me-central-1',
];
