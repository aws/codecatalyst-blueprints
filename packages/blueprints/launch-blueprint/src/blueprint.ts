import * as cp from 'child_process';
import * as fs from 'fs';
import path from 'path';
import { EnvironmentDefinition, AccountConnection, Role, Environment } from '@amazon-codecatalyst/blueprint-component.environments';
import { SourceRepository } from '@amazon-codecatalyst/blueprint-component.source-repositories';
import { ConnectionDefinition, InputVariable, WorkflowDefinition, WorkflowEnvironment } from '@amazon-codecatalyst/blueprint-component.workflows';
import { DynamicKVInput, Blueprint as ParentBlueprint, Options as ParentOptions, Selector, Tuple } from '@amazon-codecatalyst/blueprints.blueprint';
import * as yaml from 'yaml';
// eslint-disable-next-line import/no-extraneous-dependencies
import defaults from './defaults.json';

export interface Options extends ParentOptions {
  /**
   * This is the URL for the cloned repository.
   * @validationRegex /^.*$/
   * @hidden
   */
  sourceRepository: string;

  /**
   * This is the branch to clone from sourceRepository.
   * @validationRegex /^.*$/
   * @hidden
   */
  sourceBranch?: string;

  /**
   * This is the name of the destination repository to store your cloned copy of the code.
   * @validationRegex /^.*$/
   */
  destinationRepositoryName: Selector<SourceRepository | string>;

  /**
   * @showName readOnly
   */
  environments: EnvironmentDefinition<{
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
      launchRole: Role<['codecatalyst*']>;
    }>;
  }>[];

  /**
   * @readOnly
   * @deprecated use `paremeters` property instead
   */
  options: Tuple<[string, string]>[];

  /**
   * @readOnly
   */
  parameters: DynamicKVInput[];
}

const OPTIONS_PREFIX = 'LAUNCH_OPTIONS_';
const GIT_CLONE_TIMEOUT = 30_000;

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

    // create environments
    for (const environment of options.environments) {
      new Environment(this, environment);
    }

    this.state = {
      options,
      repository,
    };
  }

  override synth(): void {
    const pathToRepository = path.join(this.context.durableStoragePath, this.state.repository.title);

    if (!fs.existsSync(pathToRepository)) {
      let cloneOptions = ['clone', '--depth', '1'].concat(this.state.options.sourceBranch ? ['--branch', this.state.options.sourceBranch] : [], [
        this.state.options.sourceRepository,
        this.state.repository.title,
      ]);

      cp.spawnSync('git', cloneOptions, {
        cwd: this.context.durableStoragePath,
        stdio: [0, 1, 1],
        timeout: GIT_CLONE_TIMEOUT,
      });

      if (this.context.resynthesisPhase === 'PROPOSED') {
        const revParse = cp.spawnSync('git', ['rev-parse', 'HEAD'], {
          cwd: pathToRepository,
        });

        this.augmentOptions({ commit: revParse.stdout.toString('utf-8').trim() });
      }
    }

    const currentInstantiation = this.context.project?.blueprint?.instantiationId
      ? this.context.project.blueprint.instantiations?.find(i => i.id === this.context.project.blueprint.instantiationId)
      : undefined;
    const commitHash = currentInstantiation?.options?.authorDefined?.commit;
    if (this.context.resynthesisPhase === 'ANCESTOR' && commitHash) {
      // need to refetch since we previously just cloned at --depth=1
      cp.spawnSync('git', ['fetch', '--depth', '1', 'origin', commitHash], {
        cwd: pathToRepository,
        stdio: [0, 1, 1],
        timeout: GIT_CLONE_TIMEOUT,
      });
      cp.spawnSync('git', ['checkout', commitHash], {
        cwd: pathToRepository,
        stdio: [0, 1, 1],
      });
    } else if (commitHash) {
      // ensure repo is checked out at HEAD if phase is not ancestor
      const branch = this.state.options.sourceBranch ?? 'HEAD';
      cp.spawnSync('git', ['checkout', `refs/remotes/origin/${branch}`], {
        cwd: pathToRepository,
        stdio: [0, 1, 1],
      });
    }

    // exclude .git - we have no use for it and the large number of objects
    // contained within it could slow down the copying of sources to our workspace
    fs.cpSync(pathToRepository, this.state.repository.path, { recursive: true, filter: src => src.indexOf('.git/') === -1 });

    //map options and environments to workflows
    const workflowPath = path.join(this.state.repository.path, '.codecatalyst', 'workflows');
    if (fs.existsSync(workflowPath)) {
      const workflowFiles = fs.readdirSync(workflowPath);

      //load each workflow from the cloned repository
      for (const workflowFile of workflowFiles.filter(name => name.match(/^(.*)(\.yaml|\.yml)$/i))) {
        const workflowFilePath = path.join(workflowPath, workflowFile);
        const workflowYaml = fs.readFileSync(workflowFilePath).toString('utf-8');
        const workflow = yaml.parse(workflowYaml) as WorkflowDefinition;
        for (const actionName of Object.keys(workflow.Actions ?? [])) {
          const action = workflow.Actions?.[actionName];
          this.mapParametersToAction(action);
          for (const childActionName of Object.keys(action.Actions ?? [])) {
            const childAction = action.Actions?.[childActionName];
            this.mapParametersToAction(childAction);
          }
        }

        //overwrite existing workflow
        fs.writeFileSync(workflowFilePath, yaml.stringify(workflow));
      }
    }

    this.addExcludeFromCleanup(path.join(this.outdir, 'src', this.state.repository.title, '**'));
    super.synth();
  }

  protected mapParametersToAction(action: { [id: string]: any }) {
    //set variables with options where applicable
    const variables = action.Inputs?.Variables as InputVariable[] | undefined;
    for (const variable of variables ?? []) {
      if (variable?.Name?.startsWith(OPTIONS_PREFIX)) {
        const optionName = (variable.Name as string).replace(OPTIONS_PREFIX, '');
        const specifiedValue =
          this.state.options.parameters.find(parameter => parameter.key == optionName)?.value ??
          this.state.options.options.find(option => option[0] == optionName)?.[1];
        if (specifiedValue) {
          variable.Value = specifiedValue.toString();
        }
      }
    }

    //set action environments from options where applicable
    const actionEnvironment = action.Environment as WorkflowEnvironment | undefined;
    if (actionEnvironment?.Name) {
      const environment = this.state.options.environments.find(env => env.name == actionEnvironment.Name) as EnvironmentDefinition<{
        awsAccountConnection: AccountConnection<{
          launchRole: Role<['codecatalyst*']>;
        }>;
      }>;
      if (environment?.awsAccountConnection?.name) {
        actionEnvironment.Connections = [
          {
            Name: environment.awsAccountConnection.name,
            Role: environment.awsAccountConnection.launchRole?.name ?? 'No role selected',
          } as ConnectionDefinition,
        ];
      }
    }
  }
}
