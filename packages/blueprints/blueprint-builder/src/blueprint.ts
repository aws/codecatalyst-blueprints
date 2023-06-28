import { Blueprint as ParentBlueprint, Options as ParentOptions } from '@caws-blueprint/blueprints.blueprint';
import { SourceRepository, SourceFile, StaticAsset, File } from '@caws-blueprint-component/caws-source-repositories';
import { ProjenBlueprint } from '@caws-blueprint-util/projen-blueprint';
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
     * @validationMessage Tags should be lower dashcased
     */
    tags?: string[];

    /**
     * License for your Blueprint
     */
    license: 'MIT' | 'Apache-2.0' | 'BSD-2-Clause' | 'BSD-3-Clause' | 'ISC' | 'MPL-2.0' | 'Unlicense' | 'Public-Domain';
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

    const spaceName = this.context.spaceName || '<<unknown-organization>>';
    const packageName = `@caws-blueprint/${spaceName}.${dashName}`;

    const newBlueprintOptions = {
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
        '@caws-blueprint/blueprints.blueprint',
        '@caws-blueprint-component/caws-workflows',
        '@caws-blueprint-component/caws-source-repositories',
        '@caws-blueprint-component/caws-environments',
      ],
      description: `${options.description}`,
      devDeps: ['ts-node@^10', 'typescript', '@caws-blueprint-util/projen-blueprint', '@caws-blueprint-util/blueprint-cli'],
      keywords: [...(options.advancedSettings?.tags || ['<<tag>>'])],
      homepage: '',
      mediaUrls: [
        'https://w7.pngwing.com/pngs/147/242/png-transparent-amazon-com-logo-amazon-web-services-amazon-elastic-compute-cloud-amazon-virtual-private-cloud-cloud-computing-text-orange-logo.png',
      ],
    };
    console.log('New blueprint options:', JSON.stringify(newBlueprintOptions, null, 2));

    new ProjenBlueprint({
      parent: this,
      outdir: repository.relativePath,
      ...newBlueprintOptions,
      overridePackageVersion: '0.0.0',
    }).synth();

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
        "import { ProjenBlueprint } from '@caws-blueprint-util/projen-blueprint';",
        '',
        `const project = new ProjenBlueprint(${JSON.stringify(newBlueprintOptions, null, 2)});`,
        '',
        'project.synth();',
      ].join('\n'),
    );
  }
}
