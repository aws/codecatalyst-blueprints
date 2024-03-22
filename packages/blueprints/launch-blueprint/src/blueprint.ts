import * as cp from 'child_process';
import * as fs from 'fs';
import path from 'path';
import { EnvironmentDefinition, AccountConnection, Role, Environment } from '@amazon-codecatalyst/blueprint-component.environments';
import { SourceRepository } from '@amazon-codecatalyst/blueprint-component.source-repositories';
import {
  BuildActionParameters,
  Workflow,
  WorkflowDefinition,
  addGenericBranchTrigger,
  addGenericBuildAction,
  makeEmptyWorkflow,
} from '@amazon-codecatalyst/blueprint-component.workflows';
import { Blueprint as ParentBlueprint, Options as ParentOptions, Selector, Tuple } from '@amazon-codecatalyst/blueprints.blueprint';
// eslint-disable-next-line import/no-extraneous-dependencies
import defaults from './defaults.json';

export interface Options extends ParentOptions {
  /**
   * This is the repository import workflows will be placed into.
   * @validationRegex /^.*$/
   * @hidden
   */
  sourceRepository: string;

  /**
   * This is the name of the destination repository to store your cloned copy of the code.
   * @validationRegex /^.*$/
   */
  destinationRepositoryName: Selector<SourceRepository | string>;

  environment: EnvironmentDefinition<{
    /**
     * An AWS account connection is required by the project workflow to deploy to aws.
     * @displayName AWS account connection
     * @collapsed false
     */
    awsAccountConnection: AccountConnection<{
      /**
       * This is the role that will be used to deploy the application. It should have access to deploy all of your resources. See the Readme for more information.
       * @displayName Deploy role
       * @inlinePolicy ./inline-policy-deploy.json
       * @trustPolicy ./trust-policy.json
       */
      deployRole: Role<['codecatalyst*']>;
    }>;
  }>;

  options: Tuple<[string, string]>[];

  /**
   * Deployment options
   * @collapsed true
   */
  deployment: {
    /**
     * Steps to build and deploy
     */
    buildSteps: string[];

    /**
     * Custom container image for build and deployment
     */
    containerImage?: string;
  };
}

/**
 * This is the actual blueprint class.
 * 1. This MUST be the only 'class' exported, as 'Blueprint'
 * 2. This Blueprint should extend another ParentBlueprint
 */
export class Blueprint extends ParentBlueprint {
  private readonly state: {
    options: Options;
    repository: SourceRepository;
  };

  constructor(options_: Options) {
    super(options_);
    console.log(defaults);
    // helpful typecheck for defaults
    const typeCheck: Options = {
      outdir: this.outdir,
      ...defaults,
    };

    const options = Object.assign(typeCheck, options_);

    const repository = new SourceRepository(this, {
      title: options.destinationRepositoryName,
    });

    this.state = {
      options,
      repository,
    };

    if (options.deployment.buildSteps?.length) {
      const workflowDefinition: WorkflowDefinition = {
        ...makeEmptyWorkflow(),
        SchemaVersion: '1.0',
        Name: 'launch',
      };

      addGenericBranchTrigger(workflowDefinition, ['main']);

      addGenericBuildAction({
        blueprint: this,
        workflow: workflowDefinition,
        actionName: 'source',
        input: {
          Sources: ['WorkflowSource'],
        },
        output: {
          AutoDiscoverReports: {
            Enabled: false,
            ReportNamePrefix: 'rpt',
          },
          Artifacts: [
            {
              Name: 'src',
              Files: ['**/*'],
            },
          ],
        },
        steps: ['ls -la'],
      });

      const buildAction: BuildActionParameters & {
        blueprint: ParentBlueprint;
        workflow: WorkflowDefinition;
      } = {
        blueprint: this,
        workflow: workflowDefinition,
        actionName: 'deploy',
        input: {
          Sources: [],
          Artifacts: ['src'],
        },
        output: {
          AutoDiscoverReports: {
            Enabled: false,
            ReportNamePrefix: 'rpt',
          },
        },
        steps: [...options.deployment.buildSteps],
        environment: {
          Name: options.environment.name || ' ',
          Connections: [
            {
              Name: options.environment.awsAccountConnection?.name || ' ',
              Role: options.environment.awsAccountConnection?.deployRole?.name || ' ',
            },
          ],
        },
      };

      if (options.deployment.containerImage) {
        buildAction.container = {
          Image: options.deployment.containerImage,
          Registry: 'ECR',
        };
      }

      addGenericBuildAction(buildAction);

      // create an environment
      new Environment(this, options.environment);
      new Workflow(this, repository, workflowDefinition);
    }
  }

  override synth(): void {
    const pathToRepository = path.join(this.context.durableStoragePath, this.state.repository.title);
    if (!fs.existsSync(pathToRepository)) {
      cp.spawnSync('git', ['clone', '--depth', '1', this.state.options.sourceRepository, this.state.repository.title], {
        cwd: this.context.durableStoragePath,
        stdio: [0, 1, 1],
        timeout: 30_000,
      });

      // remove .git - we have no use for it and the large number of objects
      // contained within it could slow down the copying of sources to our workspace
      fs.rmSync(path.join(pathToRepository, '.git'), { recursive: true, force: true });
    }

    fs.cpSync(pathToRepository, this.state.repository.path, { recursive: true });

    super.synth();
  }
}
