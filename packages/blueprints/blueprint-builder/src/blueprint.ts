import { Workspace, SampleWorkspaces } from '@amazon-codecatalyst/blueprint-component.dev-environments';
import devEnvPackage from '@amazon-codecatalyst/blueprint-component.dev-environments/package.json';
import envPackage from '@amazon-codecatalyst/blueprint-component.environments/package.json';
import { SourceRepository, SourceFile, StaticAsset, File } from '@amazon-codecatalyst/blueprint-component.source-repositories';
import sourceReposPackage from '@amazon-codecatalyst/blueprint-component.source-repositories/package.json';
import { Workflow, WorkflowBuilder } from '@amazon-codecatalyst/blueprint-component.workflows';
import workflowsPackage from '@amazon-codecatalyst/blueprint-component.workflows/package.json';
import cliPackage from '@amazon-codecatalyst/blueprint-util.cli/package.json';
import { ProjenBlueprint, ProjenBlueprintOptions } from '@amazon-codecatalyst/blueprint-util.projen-blueprint';
import projenBlueprintPackage from '@amazon-codecatalyst/blueprint-util.projen-blueprint/package.json';
import {
  BlueprintSynthesisErrorTypes,
  MergeStrategies,
  Blueprint as ParentBlueprint,
  Options as ParentOptions,
} from '@amazon-codecatalyst/blueprints.blueprint';
import baseBlueprintPackage from '@amazon-codecatalyst/blueprints.blueprint/package.json';
import * as decamelize from 'decamelize';
import { buildReleaseWorkflow } from './build-release-workflow';
import defaults from './defaults.json';

devEnvPackage.version;
export interface Options extends ParentOptions {
  /**
   * What do you want to call your new blueprint?
   * @displayName Blueprint Display Name
   * @validationRegex /^[a-zA-Z0-9_-\s]+$/
   * @validationMessage Must contain only upper and lowercase letters, numbers and underscores, spaces, dashes
   */
  blueprintName: string;

  /**
   * Add a description for your new blueprint.
   * @validationRegex .*
   */
  description?: string;

  /**
   * Who is the author of the blueprint?
   * @validationRegex /^[a-zA-Z0-9_-\s]+$/
   * @validationMessage Must contain only upper and lowercase letters, numbers and underscores, spaces, dashes
   */
  authorName: string;

  /**
   * @collapsed true
   */
  advancedSettings: {
    /**
     * Blueprint tags get added to the package.json
     * @validationRegex /^[a-z-]+$/
     * @validationMessage Tags can only contain lowercase alphabetic characters or '-'
     */
    tags?: string[];

    /**
     * License for your blueprint
     */
    license: 'MIT' | 'Apache-2.0' | 'BSD-2-Clause' | 'BSD-3-Clause' | 'ISC' | 'MPL-2.0' | 'Unlicense' | 'Public-Domain';

    /**
     * Blueprints are NPM packages. Changing this will publish your blueprint as a different package.
     * If this is not set, it is initially generated from the blueprint display name and publishing space.
     * @validationRegex /^(?:@(?:[a-z0-9-*~][a-z0-9-*._~]*)?\/)?[a-z0-9-~][a-z0-9-._~]*$/
     * @validationMessage This contains characters that are not allowed in NPM package names.
     */
    blueprintPackageName?: string;

    /**
     * Generate a release workflow?
     * If this is set, the blueprint will generate a release workflow. On push to main, a workflow will release this blueprint into your codecatalyst space.
     */
    releaseWorkflow?: boolean;

    /**
     * Include a publishing step in the release workflow?
     * If this is set, the generated release workflow will contain a publishing action.
     * @hidden
     */
    includePublishingAction?: boolean;
  };
}

export class Blueprint extends ParentBlueprint {
  repository: SourceRepository;
  newBlueprintOptions: any;

  constructor(options_: Options) {
    const spaceName = process.env.CONTEXT_SPACENAME || '<<unknown-space>>';
    const dashName = decamelize.default(options_.blueprintName.toString()).replace(/[_ ]/g, '-');
    const defaultPackageName = `@amazon-codecatalyst/${spaceName}.${dashName}`.substring(0, 214).toLocaleLowerCase().replace(/[_ ]/g, '-');
    options_.advancedSettings.blueprintPackageName = options_.advancedSettings.blueprintPackageName || defaultPackageName;
    super(options_);
    /**
     * This is a typecheck to ensure that the defaults passed in are of the correct type.
     * There are some cases where the typecheck will fail, but the defaults will still be valid, such when using enums.
     * you can override this ex. myEnum: defaults.myEnum as Options['myEnum'],
     */
    const typeCheck: Options = {
      outdir: this.outdir,
      ...defaults,
      advancedSettings: {
        ...defaults.advancedSettings,
        license: defaults.advancedSettings.license as any,
      },
    };
    const options = Object.assign(typeCheck, options_);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    const repository = new SourceRepository(this, {
      title: dashName,
    });
    this.repository = repository;
    const neverUpdateFiles = ['static-assets/**', 'src/**', 'README.md'];
    this.repository.setResynthStrategies([
      {
        identifier: 'resolve_merge_conflicts',
        strategy: MergeStrategies.preferProposed,
        globs: ['**/**'],
      },
      {
        identifier: 'never_update_sample_code',
        strategy: (commonAncestorFile, existingFile, proposedFile) => {
          if (existingFile || commonAncestorFile) {
            /**
             * never replace existing files
             * mever replace a file that was removed
             */
            console.log(`file [${proposedFile?.path}] exists or there is an ancestor`);
            return existingFile;
          } else if (
            this.context.project.src.findAll({
              repositoryName: this.repository.title,
              fileGlobs: ['static-assets/**', 'src/**'],
            }).length > 0
          ) {
            /**
             * handles the case where im applying on top of an existing repository.
             * if there are already files in static-assets or src, dont update them
             */
            return existingFile;
          }
          return proposedFile;
        },
        globs: neverUpdateFiles,
      },
    ]);

    const newBlueprintOptions: ProjenBlueprintOptions = {
      authorName: options.authorName,
      publishingOrganization: spaceName,
      packageName: options_.advancedSettings.blueprintPackageName,
      name: dashName,
      displayName: options.blueprintName,
      defaultReleaseBranch: 'main',
      license: options.advancedSettings?.license || 'MIT',
      projenrcTs: true,
      sampleCode: false,
      github: false,
      eslint: true,
      jest: false,
      npmignoreEnabled: true,
      tsconfig: {
        compilerOptions: {
          esModuleInterop: true,
          noImplicitAny: false,
        },
      },
      copyrightOwner: spaceName || 'unknown',
      deps: [
        'projen',
        `@amazon-codecatalyst/blueprints.blueprint@${baseBlueprintPackage.version}`,
        `@amazon-codecatalyst/blueprint-component.workflows@${workflowsPackage.version}`,
        `@amazon-codecatalyst/blueprint-component.source-repositories@${sourceReposPackage.version}`,
        `@amazon-codecatalyst/blueprint-component.dev-environments@${devEnvPackage.version}`,
        `@amazon-codecatalyst/blueprint-component.environments@${envPackage.version}`,
      ],
      description: `${options.description}`,
      devDeps: [
        'ts-node@^10',
        'typescript',
        `@amazon-codecatalyst/blueprint-util.projen-blueprint@${projenBlueprintPackage.version}`,
        `@amazon-codecatalyst/blueprint-util.cli@${cliPackage.version}`,
        'fast-xml-parser',
      ],
      keywords: [...(options.advancedSettings?.tags || ['<<tag>>'])],
      homepage: '',
    };
    console.log('New blueprint options:', JSON.stringify(newBlueprintOptions, null, 2));
    this.newBlueprintOptions = newBlueprintOptions;
    this.setInstantiation({
      description: options.description || '',
    });

    // copy-paste additional code over it
    StaticAsset.findAll().forEach(asset => {
      if (asset.path() === 'release.sh' && !options.advancedSettings.releaseWorkflow) {
        return;
      }

      new File(repository, asset.path(), asset.content());
    });

    /**
     * Write the projenrc.ts
     */
    new SourceFile(
      repository,
      '.projenrc.ts',
      [
        "import { ProjenBlueprint } from '@amazon-codecatalyst/blueprint-util.projen-blueprint';",
        '',
        `const project = new ProjenBlueprint(${JSON.stringify(
          {
            ...newBlueprintOptions,
            deps: [
              'projen',
              '@amazon-codecatalyst/blueprints.blueprint',
              '@amazon-codecatalyst/blueprint-component.workflows',
              '@amazon-codecatalyst/blueprint-component.source-repositories',
              '@amazon-codecatalyst/blueprint-component.dev-environments',
              '@amazon-codecatalyst/blueprint-component.environments',
            ],
            devDeps: [
              'ts-node@^10',
              'typescript',
              '@amazon-codecatalyst/blueprint-util.projen-blueprint',
              '@amazon-codecatalyst/blueprint-util.cli',
              'fast-xml-parser',
            ],
          },
          null,
          2,
        )});`,
        '',
        'project.synth();',
      ].join('\n'),
    );

    /**
     * write a dev file that allows publishing within codecatalyst
     */
    new Workspace(this, repository, {
      ...SampleWorkspaces.latest,
      ...{
        components: [
          {
            name: 'aws-runtime',
            container: {
              image: 'public.ecr.aws/aws-mde/universal-image:3.0',
              env: [
                {
                  name: 'AWS_PROFILE',
                  value: 'codecatalyst',
                },
              ],
              mountSources: true,
              volumeMounts: [
                {
                  name: 'docker-store',
                  path: '/var/lib/docker',
                },
              ],
            } as any,
          },
          {
            name: 'docker-store',
            volume: {
              size: '16Gi',
            },
          },
        ],
      },
    });

    if (options.advancedSettings.releaseWorkflow) {
      const releaseWorkflow = new WorkflowBuilder(this);
      new Workflow(
        this,
        repository,
        buildReleaseWorkflow(releaseWorkflow, {
          includePublishStep: options.advancedSettings.includePublishingAction,
        }).getDefinition(),
      );
    }
  }

  synth(): void {
    super.synth();
    try {
      new ProjenBlueprint({
        outdir: this.repository.path,
        ...this.newBlueprintOptions,
        overridePackageVersion: '0.0.0',
      }).synth();
    } catch (error) {
      this.throwSynthesisError({
        name: BlueprintSynthesisErrorTypes.BlueprintSynthesisError,
        message: 'Invalid, could not synthesize code',
      });
    }
  }
}
