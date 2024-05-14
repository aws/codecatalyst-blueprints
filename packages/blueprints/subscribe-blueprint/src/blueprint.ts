import { SourceFile, SourceRepository, StaticAsset } from '@amazon-codecatalyst/blueprint-component.source-repositories';
import { Workflow, WorkflowBuilder } from '@amazon-codecatalyst/blueprint-component.workflows';
import { MergeStrategies, Blueprint as ParentBlueprint, Options as ParentOptions, Selector } from '@amazon-codecatalyst/blueprints.blueprint';
import defaults from './defaults.json';

export interface Options extends ParentOptions {
  /**
   * This is the repository import workflows will be placed into.
   * @validationRegex /^.{1,50}$/
   */
  repositoryName: Selector<SourceRepository | string>;

  /**
   * Will attempt to import these NPM packages as blueprints.
   * @validationRegex /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/
   * @validationMessage Does not match npm package regex
   * @displayName Package Name
   */
  packages: string[];

  /**
   * @collapsed true
   */
  advanced: {
    /**
     * NPM upstream registry which contains the blueprint. Private repositories require manually adding an authentication token.
     * @placeholder https://registry.npmjs.org
     * @validationRegex .*
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
    const repo = new SourceRepository(this, { title: options.repositoryName });
    const authSteps = ['npm config set always-auth true'];

    if (
      this.context.project.src.findAll({
        repositoryName: repo.title,
        fileGlobs: ['**/README.md'],
      }).length == 0
    ) {
      // if a readme doesn't already exist, add one.
      const readmeContent = new StaticAsset('generated-readme.md').content().toString();
      new SourceFile(repo, 'README.md', [readmeContent, '## Packages', ...options.packages].join('\n'));
    }

    options.packages.forEach(npmPackage => {
      const workflow = new WorkflowBuilder(this);
      const shortPackageName = npmPackage.replace('@amazon-codecatalyst/', '');
      const workflowName = `import_${shortPackageName}`.replace(/[^A-Za-z0-9_-]+/g, '_').substring(0, 100);

      workflow.setName(workflowName);
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
        actionName: 'publish_blueprint',
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
          'Check NPM 1/day for the blueprint package and publish it privately',
          `npm: ${options.advanced.npmRegistry}`,
          `package: ${npmPackage}`,
          '',
        ],
      });
    });
  }
}
