import * as cp from 'child_process';
import * as fs from 'fs';
import path from 'path';
import { EnvironmentDefinition, AccountConnection, Role, Environment } from '@amazon-codecatalyst/blueprint-component.environments';
import { SourceRepository } from '@amazon-codecatalyst/blueprint-component.source-repositories';
import { ConnectionDefinition, InputVariable, WorkflowDefinition, WorkflowEnvironment } from '@amazon-codecatalyst/blueprint-component.workflows';
import {
  KVSchema,
  OptionsSchema,
  OptionsSchemaDefinition,
  Blueprint as ParentBlueprint,
  Options as ParentOptions,
  Selector,
} from '@amazon-codecatalyst/blueprints.blueprint';
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
   */
  destinationRepositoryName: Selector<SourceRepository | string>;

  /**
   * @showName readOnly
   * @deprecated environments will be removed in a future release and can be embedded in parameters: https://github.com/aws/codecatalyst-blueprints/pull/565
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

  parameters: OptionsSchemaDefinition<'launch-options', KVSchema, KVSchema>;
}

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

      // remove .git - we have no use for it and the large number of objects
      // contained within it could slow down the copying of sources to our workspace
      fs.rmSync(path.join(pathToRepository, '.git'), { recursive: true, force: true });
    }

    fs.cpSync(pathToRepository, this.state.repository.path, { recursive: true });

    //register options to blueprint
    const embeddedOptionsPath = path.join(this.state.repository.path, '.codecatalyst', 'launch-options.yaml');
    if (fs.existsSync(embeddedOptionsPath)) {
      const embeddedOptions = yaml.parse(fs.readFileSync(embeddedOptionsPath).toString()) as { options: KVSchema };
      new OptionsSchema(this, 'launch-options', embeddedOptions.options);
    }

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
      const optionName = variable.Name as string;
      const specifiedValue = this.state.options.parameters?.find(parameter => parameter.key == optionName)?.value;
      if (specifiedValue) {
        variable.Value = specifiedValue.toString();
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

    //set parameter overrides
    if (action.Identifier?.startsWith('aws/cfn-deploy@')) {
      const overrides = action.Configuration?.['parameter-overrides'];
      if (overrides) {
        const parameters: { key: string; value: string }[] = overrides.split(',').map((p: string) => {
          const tuple = p.split('=');
          return { key: tuple[0], value: tuple[1] };
        });

        let newOverrides = '';
        for (const parameter of parameters) {
          const override = this.state.options.parameters?.find(option => option.key == parameter.key)?.value;
          newOverrides += `${parameter.key}=${override ?? parameter.value},`;
        }

        //remove trailing comma and overwrite
        if (newOverrides) {
          action.Configuration['parameter-overrides'] = newOverrides.substring(0, newOverrides.length - 1);
        }
      }
    }
  }
}
