import { Environment } from '@caws-blueprint-component/caws-environments';
import {
  convertToWorkflowEnvironment,
  WorkflowDefinition,
  emptyWorkflow,
  ComputeType,
  ComputeFleet,
  WorkflowBuilder,
  WorkflowEnvironment,
} from '@caws-blueprint-component/caws-workflows';
import { Blueprint } from '@caws-blueprint/blueprints.blueprint';

export function makeWorkflowDefintion(
  blueprint: Blueprint,
  accountConnection: Environment,
  options: {
    workflowName: string;
    stacks: {
      frontend: string;
      backend: string;
      region: string;
    };
  },
): WorkflowDefinition {
  const workflowEnvironment = convertToWorkflowEnvironment(accountConnection) as WorkflowEnvironment;

  const wfbuilder = new WorkflowBuilder(blueprint, emptyWorkflow);
  wfbuilder.setName(options.workflowName);
  wfbuilder.addBranchTrigger(['main']);
  wfbuilder.addCompute({
    Type: ComputeType.LAMBDA,
    Fleet: ComputeFleet.LINUX_X86_64_LARGE,
  });

  // To build and package the backend
  wfbuilder.addBuildAction({
    actionName: 'BackendBuildAndPackage',
    input: {
      Sources: ['WorkflowSource'],
    },
    steps: ['cd backend', 'mvn verify', 'mvn package -Dmaven.test.skip'],
    output: {
      AutoDiscoverReports: {
        Enabled: true,
        ReportNamePrefix: 'rpt',
        IncludePaths: ['cdk/target/**/*', 'lambda/target/**/*'],
        ExcludePaths: ['*/.aws/workflows/*'],
      },
      Artifacts: [
        {
          Name: 'backend_build_artifacts',
          Files: ['**/*'],
        },
      ],
    },
  });

  // To build and package the frontend
  wfbuilder.addBuildAction({
    actionName: 'FrontendBuildAndPackage',
    input: {
      Sources: ['WorkflowSource'],
    },
    steps: [
      'cd frontend',
      'npm install',
      'npm test -- --coverage --watchAll=false',
      'echo "REACT_APP_SERVICE_URL=/t" > ".env"', // To set the api path for the frontend
      'npm run build',
      'cp -r canary build',
      'cp -r cdk/* .',
    ],
    output: {
      AutoDiscoverReports: {
        IncludePaths: ['frontend/coverage/*'],
        ReportNamePrefix: 'rpt',
        Enabled: true,
      },
      Artifacts: [
        {
          Name: 'frontend_build_artifacts',
          Files: ['**/*'],
        },
      ],
    },
  });

  // To bootstrap the account
  wfbuilder.addCdkBootstrapAction({
    actionName: 'CDKBootstrapAction',
    inputs: {
      Sources: ['WorkflowSource'],
    },
    configuration: {
      Region: options.stacks.region,
    },
    environment: workflowEnvironment,
  });

  // To deploy the backend
  wfbuilder.addCdkDeployAction({
    actionName: 'BackendCDKDeploy',
    inputs: {
      Artifacts: ['backend_build_artifacts'],
    },
    dependsOn: ['BackendBuildAndPackage', 'CDKBootstrapAction'],
    environment: workflowEnvironment,
    configuration: {
      StackName: options.stacks.backend,
      Region: options.stacks.region,
      Context: {
        stack_name: options.stacks.backend,
      },
      CdkRootPath: 'backend/',
    },
  });

  // To deploy the frontend
  wfbuilder.addCdkDeployAction({
    actionName: 'FrontendCDKDeploy',
    dependsOn: ['FrontendBuildAndPackage', 'BackendCDKDeploy'],
    inputs: {
      Artifacts: ['frontend_build_artifacts'],
    },
    configuration: {
      StackName: options.stacks.frontend,
      Region: options.stacks.region,
      Context: {
        stack_name: options.stacks.frontend,
        api_domain: '${BackendCDKDeploy.ApiDomain}',
        api_stage: '${BackendCDKDeploy.ApiStage}',
      },
      CdkRootPath: 'frontend/',
    },
    environment: workflowEnvironment,
  });

  return wfbuilder.definition;
}
