import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { WorkflowDefinition } from '../workflow/workflow';
import { ActionDefiniton, ActionIdentifierAlias, getDefaultActionIdentifier } from './action';
import { BuildActionParameters } from './action-build';

export const DEFAULT_DELETE_RESOURCE_WORKFLOW_NAME = 'DANGER-hard-delete-deployed-resources';

const generateUniqueS3BucketName = () => {
  // Excluding '.' and '-' which can lead to invalid bucket name
  const allowedChars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let bucketName = '';
  for (let i = 0; i < 63; i++) {
    const randomCharIndex = Math.floor(Math.random() * allowedChars.length);
    bucketName += allowedChars[randomCharIndex];
  }
  return bucketName;
};

export const cfnCleanupSteps = (stackName: string, region: string) => {
  return [
    `stack_name=${stackName}`,
    `region=${region}`,
    `cfn_template_upload_bucket=${generateUniqueS3BucketName()} # we need an S3 bucket to temporarily host the updated cloudformation template because template-body has a max length of 51,200 bytes which may not be enough in some cases`,
    'echo \'Update existing cloudformation template to change resources deletion policy to "Delete", and set deletion policy for S3 buckets and Elastic Container Registry to "Retain" which will be manually cleaned up later.\'',
    'pip install cfn-flip',
    'aws cloudformation get-template --stack-name $stack_name --region $region > existing-template-$stack_name.json',
    "jq -r '.TemplateBody' ./existing-template-$stack_name.json | cfn-flip -o json > ./existing-template-body-$stack_name.json",
    'jq \'if .Resources? then (.Resources[]? | select(.Type != "AWS::S3::Bucket" and .Type != "AWS::ECR::Repository") | select(.DeletionPolicy!=null) | .DeletionPolicy) = "Delete" else . end\' ./existing-template-body-$stack_name.json > ./temporary-template-body-$stack_name.json',
    'jq \'if .Resources? then (.Resources[]? | select(.Type == "AWS::S3::Bucket" or .Type == "AWS::ECR::Repository")) |= (.DeletionPolicy = "Retain") else . end\' ./temporary-template-body-$stack_name.json > ./updated-template-$stack_name.json',
    "echo 'Create a temporary S3 bucket to host the updated cloudformation template, and this will be cleaned up afterwards.'",
    `aws s3api create-bucket --bucket $cfn_template_upload_bucket --region $region ${
      region === 'us-east-1' ? '' : '--create-bucket-configuration LocationConstraint=$region'
    } || true`,
    'echo \'Update the cloudformation stack and wait for the status to no longer be "UPDATE_IN_PROGRESS" , ignoring the case when it needs not be updated.\'',
    'aws s3 cp ./updated-template-$stack_name.json s3://$cfn_template_upload_bucket/updated-template-$stack_name.json',
    'aws cloudformation update-stack --stack-name $stack_name --region $region --template-url https://s3.amazonaws.com/$cfn_template_upload_bucket/updated-template-$stack_name.json --capabilities CAPABILITY_NAMED_IAM || true',
    'timeout 300 bash -c \'while true; do status=$(aws cloudformation describe-stacks --stack-name "$stack_name" --region $region --query "Stacks[0].StackStatus" --output text); if [[ "$status" == "UPDATE_IN_PROGRESS" ]]; then sleep 10; else break; fi; done\'',
    "echo 'Store the list of associated S3 buckets and Elastic Container Registries'",
    'BUCKET_NAMES=$(aws cloudformation list-stack-resources --stack-name $stack_name --region $region | jq -r \'.StackResourceSummaries[] | select(.ResourceType=="AWS::S3::Bucket") | .PhysicalResourceId\')',
    'ECR_NAMES=$(aws cloudformation list-stack-resources --stack-name $stack_name --region $region | jq -r \'.StackResourceSummaries[] | select(.ResourceType=="AWS::ECR::Repository") | .PhysicalResourceId\')',
    "echo 'Initiate cloudformation delete-stack command and wait for completion.'",
    'aws cloudformation delete-stack --stack-name $stack_name --region $region',
    'aws cloudformation wait stack-delete-complete --stack-name $stack_name --region $region',
    "echo 'Cloudformation stack deletion completed.'",
    "echo 'Clean up and delete all associated S3 buckets, including the temporary bucket created. If versioning is enabled, delete all markers and versions as well.'",
    'for BUCKET_NAME in $BUCKET_NAMES; do ' +
      'if aws s3api head-bucket --bucket $BUCKET_NAME --region $region > /dev/null 2>&1; then ' +
      'if aws s3api get-bucket-versioning --bucket $BUCKET_NAME --region $region | grep -q \'"Status": "Enabled"\'; then ' +
      'aws s3api delete-objects --bucket $BUCKET_NAME --region $region  --delete "$(aws s3api list-object-versions --bucket $BUCKET_NAME --region $region  --query=\'{Objects: Versions[].{Key:Key,VersionId:VersionId}}\')";' +
      'aws s3api delete-objects --bucket $BUCKET_NAME --region $region  --delete "$(aws s3api list-object-versions --bucket $BUCKET_NAME --region $region  --query=\'{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}\')";' +
      'fi;' +
      'aws s3 rb --force s3://$BUCKET_NAME --region $region;' +
      'fi;' +
      'done',
    'aws s3 rb --force s3://$cfn_template_upload_bucket --region $region',
    "echo 'All S3 buckets cleaned up.'",
    "echo 'Clean up and delete all associated Elastic Container Registries.'",
    'for ECR_NAME in $ECR_NAMES; do aws ecr describe-repositories --repository-name $ECR_NAME --region $region > /dev/null 2>&1 && aws ecr delete-repository --repository-name $ECR_NAME --region $region --force || true; done',
    "echo 'All Elastic Container Registries cleaned up. '",
    "echo 'Cleanup action is now completed.'",
  ];
};

export interface CfnCleanupActionParameters extends Pick<BuildActionParameters, 'actionName' | 'environment' | 'dependsOn'> {
  stackName: string;
  region: string;
}

export const addGenericCloudFormationCleanupAction = (
  params: CfnCleanupActionParameters & {
    blueprint: Blueprint;
    workflow: WorkflowDefinition;
  },
): string => {
  const { blueprint, workflow, stackName, region, environment, dependsOn } = params;
  const actionName = (params.actionName || 'CleanupCloudFormationStack').replace(new RegExp('-', 'g'), '_');

  const buildAction: ActionDefiniton = {
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.build, blueprint.context.environmentId),
    Configuration: {
      Steps: cfnCleanupSteps(stackName, region).map(step => {
        return {
          Run: step,
        };
      }),
    },
    Environment: environment,
    DependsOn: dependsOn,
  };

  workflow.Actions = workflow.Actions || {};
  workflow.Actions[actionName] = buildAction;
  return actionName;
};
