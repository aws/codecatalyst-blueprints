import { Workspace, SampleWorkspaces } from '@amazon-codecatalyst/blueprint-component.dev-environments';
import devEnvPackage from '@amazon-codecatalyst/blueprint-component.dev-environments/package.json';
import envPackage from '@amazon-codecatalyst/blueprint-component.environments/package.json';
import { SourceRepository, SourceFile, StaticAsset, File } from '@amazon-codecatalyst/blueprint-component.source-repositories';
import sourceReposPackage from '@amazon-codecatalyst/blueprint-component.source-repositories/package.json';
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
   * Would you like to include a CDK project (TypeScript) in this blueprint?
   * @displayName Include CDK project?
   */
  includeCdkProject?: boolean;

  /**
   * @collapsed true
   */
  advancedSettings: {
    /**
     * Blueprint Tags. These get added to the package.json
     * @validationRegex /^[a-z-]+$/
     * @validationMessage Tags can only contain lowercase alphabetic characters or '-'
     */
    tags?: string[];

    /**
     * License for your Blueprint
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
     * The repository in which your blueprint code is stored
     * @hidden
     * @validationRegex /^[a-zA-Z0-9_-\s]+$/
     * @validationMessage Must contain only upper and lowercase letters, numbers and underscores, spaces, dashes
     */
    repositoryName?: string;

    /**
     * Template for your CDK project, if included.
     * @displayName CDK template
     */
    cdkTemplate: 'app' | 'lib';
  };
}

export class Blueprint extends ParentBlueprint {
  repository: SourceRepository;
  newBlueprintOptions: any;

  constructor(options_: Options) {
    const spaceName = process.env.CONTEXT_SPACENAME || '<<unknown-space>>';
    const dashName = decamelize.default(options_.blueprintName.toString()).replace(/[_ ]/g, '-');
    const defaultPackageName = `@amazon-codecatalyst/${spaceName}.${dashName}`.substring(0, 214).toLocaleLowerCase().replace(/[_ ]/g, '-');
    options_.advancedSettings.repositoryName = options_.advancedSettings.repositoryName || dashName;
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
        cdkTemplate: defaults.advancedSettings.cdkTemplate as any,
      },
    };
    const options = Object.assign(typeCheck, options_);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    const repository = new SourceRepository(this, {
      title: options_.advancedSettings.repositoryName,
    });
    this.repository = repository;
    this.repository.setResynthStrategies([
      {
        identifier: 'never_update_sample_code',
        strategy: MergeStrategies.neverUpdate,
        globs: ['static-assets/**', 'src/**'],
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
      ],
      keywords: [...(options.advancedSettings?.tags || ['<<tag>>'])],
      homepage: '',
    };
    console.log('New blueprint options:', JSON.stringify(newBlueprintOptions, null, 2));
    this.newBlueprintOptions = newBlueprintOptions;

    // copy-paste additional code over it
    StaticAsset.findAll('root/**').forEach(asset => {
      new File(repository, asset.path().replace('root/', ''), asset.content());
    });

    // copy-paste different code if CDK project is selected
    if (options.includeCdkProject) {

      // dictates whether CDK project uses an app or lib (construct) template
      const templateType = options.advancedSettings?.cdkTemplate;

      // copy-paste CDK init code for template
      StaticAsset.findAll(`cdk-typescript/${templateType}/**`).forEach(asset => {
        new File(repository, asset.path().replace(`cdk-typescript/${templateType}`, 'static-assets'), asset.content());
      });

      // copy-paste defaults.json for template
      const blueprintDefaults = new StaticAsset(`cdk-typescript/${templateType}-defaults.json`);
      new File(repository, blueprintDefaults.path().replace('cdk-typescript', 'src').replace(`${templateType}-defaults`, 'defaults'), blueprintDefaults.content());

      // copy-paste blueprint.ts for template
      const blueprint = new StaticAsset(`cdk-typescript/${templateType}-blueprint.ts`);
      new File(repository, blueprint.path().replace('cdk-typescript', 'src').replace(`${templateType}-blueprint`, 'blueprint'), blueprint.content());

    } else {

      // if CDK project is not selected, just copy-paste original default files
      StaticAsset.findAll('default/**').forEach(asset => {
        new File(repository, asset.path().replace('default', 'static-assets'), asset.content());
      });

    }

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
            devDeps: ['ts-node@^10', 'typescript', '@amazon-codecatalyst/blueprint-util.projen-blueprint', '@amazon-codecatalyst/blueprint-util.cli'],
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