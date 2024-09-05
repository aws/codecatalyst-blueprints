import { Environment } from '@amazon-codecatalyst/blueprint-component.environments';
import { WorkflowBuilder, convertToWorkflowEnvironment } from '@amazon-codecatalyst/blueprint-component.workflows';
import { Blueprint as ParentBlueprint } from '@amazon-codecatalyst/blueprints.blueprint';
import { Options } from './blueprint';

const cdkVersion = '2.155.0';

/**
 * Models used by the chatbot
 */
const requiredModels: Record<string, string> = {
  'anthropic.claude-3-sonnet-20240229-v1:0': 'Anthropic Claude 3 Sonnet',
  'anthropic.claude-3-haiku-20240307-v1:0': 'Anthropic Claude 3 Haiku',
  'cohere.embed-multilingual-v3': 'Cohere Embed Multilingual',
};

export const getDeploymentWorkflow = (blueprint: ParentBlueprint, options: Options, environment: Environment): WorkflowBuilder => {
  const workflowEnvironment = convertToWorkflowEnvironment(environment);

  const bootstrapRegions = new Set<string>([
    options.code.region as string,
    'us-east-1', // WAF is always deployed to us-east-1
  ]);

  const workflowBuilderDev = new WorkflowBuilder(blueprint);
  workflowBuilderDev.setName('cdk-workflow');
  workflowBuilderDev.addBuildAction({
    actionName: 'ValidateModelAccess',
    steps: [
      `region=${options.code.bedrockRegion}`,
      ...Object.keys(requiredModels).flatMap(model => {
        return [
          `MODEL_ACCESS=$(aws bedrock-runtime invoke-model --region $region --model-id "${model}" --body ${btoa(
            JSON.stringify({ dummy: 'param' }),
          )} /dev/null 2>&1 || true)`,
          `if [[ $MODEL_ACCESS == *"AccessDeniedException"* ]]; then echo "Access denied for model ${model}"; exit 1; else echo "Access validated for model ${model}"; fi`,
        ];
      }),
    ],
    environment: workflowEnvironment!,
  });

  const bootstrapActions: string[] = [];
  for (const region of bootstrapRegions) {
    const actionName = `bootstrap-${region}`.replace(/-/gi, '_');
    bootstrapActions.push(actionName);
    workflowBuilderDev.addCdkBootstrapAction({
      actionName,
      inputs: {
        Sources: ['WorkflowSource'],
      },
      configuration: {
        Region: region,
        CdkCliVersion: cdkVersion,
      },
      computeName: {
        Type: 'EC2',
      },
      environment: workflowEnvironment!,
      dependsOn: ['ValidateModelAccess'],
    });
  }

  const workflow = workflowBuilderDev
    .addBranchTrigger(['main'])
    .addBuildAction({
      actionName: 'BuildFrontend',
      input: {
        Sources: ['WorkflowSource'],
        Artifacts: [],
      },
      output: {
        Artifacts: [
          {
            Name: 'frontend',
            Files: ['**/*'],
          },
        ],
      },
      container: {
        Registry: 'CODECATALYST',
        Image: 'CodeCatalystLinux_x86_64:2024_03',
      },
      steps: ['dnf install -y nodejs', 'cd frontend', 'npm i'],
      dependsOn: ['ValidateModelAccess'],
    })
    .addCdkDeployAction({
      actionName: 'CDKDeployAction',
      inputs: {
        Sources: [],
        Artifacts: ['frontend'],
      },
      configuration: {
        Region: options.code.region as string,
        StackName: options.code.stackName as string,
        CfnOutputVariables: ['FrontendURL'],
        CdkCliVersion: cdkVersion,
        CdkRootPath: 'cdk',
      },
      dependsOn: [...bootstrapActions, 'BuildFrontend'],
      computeName: {
        Type: 'EC2',
      },
      environment: workflowEnvironment!,
    });

  return workflow;
};
