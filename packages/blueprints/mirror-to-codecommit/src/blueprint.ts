import devEnvPackage from '@amazon-codecatalyst/blueprint-component.dev-environments/package.json';
import { AccountConnection, Environment, EnvironmentDefinition, Role } from '@amazon-codecatalyst/blueprint-component.environments';
import { SourceRepository } from '@amazon-codecatalyst/blueprint-component.source-repositories';
import {
  ComputeFleet,
  ComputeType,
  TriggerType,
  Workflow,
  WorkflowBuilder,
  convertToWorkflowEnvironment,
  RunModeDefiniton,
} from '@amazon-codecatalyst/blueprint-component.workflows';
import {
  BlueprintSynthesisError,
  BlueprintSynthesisErrorTypes,
  MultiSelect,
  Blueprint as ParentBlueprint,
  Options as ParentOptions,
  Region,
} from '@amazon-codecatalyst/blueprints.blueprint';
import defaults from './defaults.json';

devEnvPackage.version;
export interface Options extends ParentOptions {
  /**
   * Select the source repository you'd like to mirror.
   */
  repositories?: MultiSelect<SourceRepository | string>;

  /**
   * Configure CodeCommit account and regional configuration
   * @displayName CodeCommit Configuration
   */
  account: {
    environment: EnvironmentDefinition<{
      /**
       * @displayName AWS account you want to mirror into
       */
      connection: AccountConnection<{
        /**
         * This is the role that will be used to Run the sync.
         * @displayName Sync role
         */
        deployRole: Role<['codecatalyst*']>;
      }>;
    }>;

    /**
     * This is the region codecommit
     * @displayName CodeCommit region
     */
    region: Region<['*']>;
  };
}

export class Blueprint extends ParentBlueprint {
  constructor(options_: Options) {
    super(options_);
    /**
     * This is a typecheck to ensure that the defaults passed in are of the correct type.
     * There are some cases where the typecheck will fail, but the defaults will still be valid, such when using enums.
     * you can override this ex. myEnum: defaults.myEnum as Options['myEnum'],
     */
    const typeCheck: Options = {
      outdir: this.outdir,
      ...defaults,
    };
    const options = Object.assign(typeCheck, options_);

    if (!this.context.project.src.listRepositoryNames().length) {
      this.throwSynthesisError(
        new BlueprintSynthesisError({
          message: 'This project has no existing repositories to mirror. Did you mean to create this in another project?',
          type: BlueprintSynthesisErrorTypes.ValidationError,
        }),
      );
    }

    if (options.repositories?.length) {
      this.setInstantiation({
        description: `Manages CodeCommit Mirrors for: [${options.repositories.join(',')}]`,
      });
    }
    const branch = 'main';
    const environment = options.account.environment && new Environment(this, options.account.environment);
    for (const repositoryName of options.repositories || []) {
      const repository = new SourceRepository(this, {
        title: repositoryName as string,
      });
      const mirrorWorkflow = new WorkflowBuilder(this, {
        Name: `${repository.title}-mirror-to-codecommit`,
        Compute: {
          Type: ComputeType.LAMBDA,
          Fleet: ComputeFleet.LINUX_X86_64_XLARGE,
        },
        Triggers: [
          {
            Type: TriggerType.PUSH,
            Branches: [branch],
          },
        ],
        RunMode: RunModeDefiniton.QUEUED,
      });
      mirrorWorkflow.addBuildAction({
        actionName: 'SyncBranch',
        steps: [
          // # Creates the CodeCommit repository if it doesn't exist:
          `aws codecommit get-repository --repository-name ${repository.title} || aws codecommit create-repository --repository-name ${repository.title}`,
          // # Configure git to use AWS credential helper, which relies on the CI/CD
          // # Environment's AWS Connection and Role:
          "git config credential.helper '!aws codecommit credential-helper $@'",
          'git config credential.UseHttpPath true',

          // # Push the branch to CodeCommit:
          // # (Do not force push, as PicaPica doesn't support this)
          `git push https://git-codecommit.${options.account.region}.amazonaws.com/v1/repos/${repository.title} refs/remotes/origin/${branch}:refs/heads/${branch}`,
        ],
        input: {
          Sources: ['WorkflowSource'],
        },
        container: {
          Registry: 'CODECATALYST',
          Image: 'CodeCatalystLinuxLambda_x86_64:2024_03',
        },
        environment: convertToWorkflowEnvironment(environment),
      });

      new Workflow(this, repository, mirrorWorkflow.getDefinition());
    }
  }
}
