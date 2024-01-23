import { SourceRepository } from '@amazon-codecatalyst/blueprint-component.source-repositories';
import { Workflow, WorkflowBuilder } from '@amazon-codecatalyst/blueprint-component.workflows';
import { Blueprint as ParentBlueprint, Options as ParentOptions } from '@amazon-codecatalyst/blueprints.blueprint';
import defaults from './defaults.json';

export interface Options extends ParentOptions {
  /**
   * Will attempt to import these NPM packages as blueprints.
   * @displayName Package Name
   */
  packages: string[];

  /**
   * @collapsed
   */
  advanced: {
    repositoryName: string;
    /**
     * NPM registry that is set as upstream
     * @placeholder https://registry.npmjs.org
     */
    npmRegistry: string;
  };
}

/**
 * This is the actual blueprint class.
 * 1. This MUST be the only 'class' exported, as 'Blueprint'
 * 2. This Blueprint should extend another ParentBlueprint
 */
export class Blueprint extends ParentBlueprint {
  constructor(options_: Options) {
    super(options_);
    console.log(defaults);
    // helpful typecheck for defaults
    const typeCheck: Options = {
      outdir: this.outdir,
      ...defaults,
    };
    const options = Object.assign(typeCheck, options_);

    // add a repository
    const repo = new SourceRepository(this, { title: options.advanced.repositoryName });

    const authSteps = ['npm config set always-auth true'];

    options.packages.forEach(npmPackage => {
      const workflow = new WorkflowBuilder(this);
      workflow.addBranchTrigger(['main']);
      workflow.setDefinition({
        ...workflow.getDefinition(),
        Triggers: [
          ...(workflow.definition.Triggers || []),
          {
            Type: 'SCHEDULE',
            Branches: ['main'],
            /**
             * every day at midnight
             */
            Expression: '0 0 * * ? *',
          } as any,
        ],
      });

      workflow.addBuildAction({
        actionName: 'pull_blueprint_package',
        input: {
          Sources: ['WorkflowSource'],
        },
        steps: [
          `npm set registry=${options.advanced.npmRegistry}`,
          ...authSteps,
          'mkdir tmp-package',
          `npm pack ${npmPackage} --pack-destination tmp-package`,
          'tar -xvf ./tmp-package/*.tgz',
          'ls -l',
        ],
        output: {
          Artifacts: [
            {
              Name: 'files',
              Files: ['**/*'],
            },
          ],
        },
      });

      workflow.addGenericAction({
        ActionName: 'publish_blueprint',
        Identifier: 'aws/publish-blueprint-action@v1',
        Inputs: {
          Artifacts: ['files'],
          Variables: [
            {
              Name: 'SKIP_DUPLICATE_VERSION',
              Value: 'True',
            },
          ],
        },
        Compute: {
          Type: 'EC2',
        },
        Configuration: {
          InputArtifactName: 'files',
          PackageJSONPath: 'package/package.json',
          TimeoutInSeconds: '120',
          ArtifactPackagePath: './tmp-package/*.tgz',
        },
      });

      new Workflow(this, repo, workflow.getDefinition(), {
        additionalComments: [
          'This workflow has been generated from the blueprint importer',
          'This workflow has been configured to: ',
          `look at ${options.advanced.npmRegistry} for package ${npmPackage} and attempt to publish it as a blueprint into this space.`,
        ],
      });
    });
  }
}
