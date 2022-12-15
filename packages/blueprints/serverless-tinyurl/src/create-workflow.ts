import { Environment } from '@caws-blueprint-component/caws-environments';
import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import {
  Workflow,
  convertToWorkflowEnvironment,
  getDefaultActionIdentifier,
  ActionIdentifierAlias,
  WorkflowDefinition,
  emptyWorkflow,
  ComputeType,
  ComputeFleet,
  addGenericCompute,
  addGenericBranchTrigger,
  addGenericBuildAction,
  WorkflowBuilder,
  WorkflowEnvironment,
} from '@caws-blueprint-component/caws-workflows';

// enum WorkflowActionIdEnum {
//   CDKBootstrap = 'aws/cdk-bootstrap',
//   CDKDeploy = 'aws/cdk-deploy',
// }

// private getActions() {
//   return {
//     'aws/cdk-bootstrap': ['@v1', '-gamma'],
//     'aws/cdk-deploy': ['@v1', '-gamma'],
//   };
// }

// private getActionMapping(action: WorkflowActionIdEnum): string {
//   getDefaultActionIdentifier(ActionIdentifierAlias.build);
//   const [vz, ext] = this.getActions()[action];
//   return `${action}${this.options.environment.environmentType === 'PRODUCTION' ? '' : ext}${vz}`;
// }

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
  wfbuilder.addBranchTrigger(['main']),
    wfbuilder.addCompute({
      Type: ComputeType.LAMBDA,
      Fleet: ComputeFleet.LINUX_X86_64_LARGE,
    });

  /**
   * general notes:
   * this dependency flow doesnt make any sense to me:
   * in my head we should
   * t. trigger
   * 1. build and test the backend
   * 2. build and test the frontend
   * 3. bootstrap the backend
   * 4. bootstrap the frontend
   * 5. deploy the backend
   * 6. deploy the frontend
   *   t
   * 1 . 2
   * | . |
   * 3 . 4
   * | . |
   * 5 . |
   *  \  |
   *    6
   *
   * I dont understand this workflow as it looks today.
   *
   * I also dont understand why we are doing mv in several places.
   * This has the effect of making the code running in the workflow
   * different at workflow execution time than it would be if I was
   * running the same commands locally, This makes it super super difficult
   * for customers to debug if they want to use this app as the starting
   * point for a real project.
   */
  wfbuilder.addBuildAction({
    actionName: 'BackendBuildAndPackage',
    input: {
      Sources: ['WorkflowSource'],
    },
    steps: [
      'mv backend/* .', //TODO: why are we doing this?!
      'mvn package -Dmaven.test.skip',
    ],
    output: {
      Artifacts: [
        {
          Name: 'backend_build_artifacts',
          Files: ['**/*'],
        },
      ],
    },
    environment: workflowEnvironment, // TODO: why do we need this?!
  });

  wfbuilder.addBuildAction({
    actionName: 'BackendTest',
    input: {
      Sources: ['WorkflowSource'],
    },
    steps: ['cd backend', 'mvn verify', 'sh jacocoConsoleReporter.sh'],
    output: {
      AutoDiscoverReports: {
        Enabled: true,
        ReportNamePrefix: 'Rpt',
        IncludePaths: ['backend/cdk/target/**/*', 'backend/lambda/target/**/*'],
        ExcludePaths: ['*/.aws/workflows/*'],
      },
      Artifacts: [
        {
          Name: 'backend_test_artifacts',
          Files: ['**/*'],
        },
      ],
    },
    environment: workflowEnvironment, // TODO: why do we need this?!
  });

  wfbuilder.addCdkBootstrapAction({
    actionName: 'BackendCDKBootstrapAction',
    inputs: {
      Artifacts: ['backend_build_artifacts'],
    },
    dependsOn: ['BackendBuildAndPackage', 'BackendTest'],
    configuration: {
      Region: options.stacks.region,
    },
    environment: workflowEnvironment,
  });

  wfbuilder.addCdkDeployAction({
    actionName: 'BackendCDKDeploy',
    inputs: {
      Artifacts: ['backend_build_artifacts'],
    },
    dependsOn: ['BackendCDKBootstrapAction'],
    environment: workflowEnvironment,
    configuration: {
      StackName: options.stacks.backend,
      Region: options.stacks.region,
      Context: {
        stack_name: options.stacks.backend,
      },
    },
  });

  wfbuilder.addBuildAction({
    actionName: 'FrontendBuildAndPackage',
    dependsOn: ['BackendCDKDeploy'], //TODO: is this really the case? Why does a build of the frontend have to wait until the backend has been deployed?
    input: {
      Sources: ['WorkflowSource'],
    },
    steps: [
      'cd frontend',
      'npm install',
      'echo "REACT_APP_SERVICE_URL=/t" > ".env"', // TODO: what is this?!
      'npm run build',
      'cp -r canary build',
      'mv cdk/* ..', // TODO: what is this?!
    ],
    output: {
      AutoDiscoverReports: {
        IncludePaths: ['frontend/**/*'],
        ExcludePaths: ['*/.aws/workflows/*'],
        ReportNamePrefix: 'rpt',
        Enabled: false, // TODO: what is this?! Why are test reports disabled here?
      },
      Artifacts: [
        {
          Name: 'frontend_build_artifacts',
          Files: ['**/*'],
        },
      ],
    },
    environment: workflowEnvironment, //TODO: why does this build step need access to the environment?
  });

  wfbuilder.addBuildAction({
    actionName: 'FrontendTest',
    dependsOn: ['BackendCDKDeploy'], //TODO: is this really the case? Why does a build of the frontend have to wait until the backend has been deployed?
    input: {
      Sources: ['WorkflowSource'],
    },
    steps: [
      'cd frontend', // TODO: what is this?!
      'npm install', // TODO: what is this?! aren't these two steps run above? Can these be combined?
      'npm test -- --coverage --watchAll=false',
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
    environment: workflowEnvironment, //TODO: why does this test step need access to the environment?
  });

  wfbuilder.addCdkDeployAction({
    actionName: 'FrontendCDKDeploy',
    dependsOn: ['FrontendTest', 'FrontendBuildAndPackage'], //TODO: shouldn't this also depend on the backend stack?
    inputs: {
      Artifacts: ['frontend_build_artifacts'], // TODO: shouldn't this also have an input from the backend build artifacts? Or atleast from the backend CDK deploy? How else do I know where the backend stack is deployed, like its endpoint?
    },
    configuration: {
      StackName: options.stacks.frontend,
      Region: options.stacks.region,
      Context: {
        stack_name: options.stacks.frontend,
        api_domain: '${BackendCDKDeploy.ApiDomain}',
        api_stage: '${BackendCDKDeploy.ApiStage}',
      },
    },
    environment: workflowEnvironment,
  });

  return wfbuilder.getDefinition();
}
