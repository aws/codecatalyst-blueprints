import { SourceRepository, SourceFile, StaticAsset, File } from '@amazon-codecatalyst/blueprint-component.source-repositories';
import { ProjenBlueprint, ProjenBlueprintOptions } from '@amazon-codecatalyst/blueprint-util.projen-blueprint';
import {
  BlueprintSynthesisErrorTypes,
  MergeStrategies,
  Blueprint as ParentBlueprint,
  Options as ParentOptions,
} from '@amazon-codecatalyst/blueprints.blueprint';
import * as decamelize from 'decamelize';
import defaults from './defaults.json';

export interface Options extends ParentOptions {
  /**
   * What do you want to call your new blueprint?
   * @validationRegex /^[a-z-]+$/
   * @validationMessage Can only contain lowercase alphabetic characters or '-'
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
  advancedSettings?: {
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
  };
}

export class Blueprint extends ParentBlueprint {
  repository: SourceRepository;
  newBlueprintOptions: any;

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
      advancedSettings: {
        ...defaults.advancedSettings,
        license: defaults.advancedSettings.license as any,
      },
    };
    const options = Object.assign(typeCheck, options_);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dashName = decamelize.default(options.blueprintName.toString()).replace(/_/g, '-');

    const repository = new SourceRepository(this, {
      title: dashName,
    });
    this.repository = repository;
    this.repository.setResynthStrategies([
      {
        identifier: 'never_update_sample_code',
        strategy: MergeStrategies.neverUpdate,
        globs: ['static-assets/**', 'src/**'],
      },
    ]);

    const spaceName = this.context.spaceName || '<<unknown-organization>>';
    const packageName = `@amazon-codecatalyst/${spaceName}.${dashName}`;

    const newBlueprintOptions: ProjenBlueprintOptions = {
      authorName: options.authorName,
      publishingOrganization: spaceName,
      packageName,
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
        '@amazon-codecatalyst/blueprints.blueprint',
        '@amazon-codecatalyst/blueprint-component.workflows',
        '@amazon-codecatalyst/blueprint-component.source-repositories',
        '@amazon-codecatalyst/blueprint-component.dev-environments',
        '@amazon-codecatalyst/blueprint-component.environments',
      ],
      description: `${options.description}`,
      devDeps: ['ts-node@^10', 'typescript', '@amazon-codecatalyst/blueprint-util.projen-blueprint', '@amazon-codecatalyst/blueprint-util.cli'],
      keywords: [...(options.advancedSettings?.tags || ['<<tag>>'])],
      homepage: '',
      mediaUrls: [
        'https://w7.pngwing.com/pngs/147/242/png-transparent-amazon-com-logo-amazon-web-services-amazon-elastic-compute-cloud-amazon-virtual-private-cloud-cloud-computing-text-orange-logo.png',
      ],
    };
    console.log('New blueprint options:', JSON.stringify(newBlueprintOptions, null, 2));
    this.newBlueprintOptions = newBlueprintOptions;

    // copy-paste additional code over it
    StaticAsset.findAll().forEach(asset => {
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
        `const project = new ProjenBlueprint(${JSON.stringify(newBlueprintOptions, null, 2)});`,
        '',
        'project.synth();',
      ].join('\n'),
    );
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
