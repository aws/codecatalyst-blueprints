/* eslint-disable @typescript-eslint/no-unused-vars */
import * as cp from 'child_process';
import * as path from 'path';
import { SourceRepository, SourceFile, StaticAsset } from '@caws-blueprint-component/caws-source-repositories';
import { buildIndex } from '@caws-blueprint-util/blueprint-utils';
import { ProjenBlueprint, ProjenBlueprintOptions } from '@caws-blueprint-util/projen-blueprint';
import { Blueprint as ParentBlueprint, Options as ParentOptions } from '@caws-blueprint/blueprints.blueprint';

import * as decamelize from 'decamelize';
import { YamlFile } from 'projen';

import { buildBlueprint } from './build-blueprint';
import defaults from './defaults.json';
import { BlueprintIntrospection, introspectBlueprint } from './introspect-blueprint';
import { buildGenerationObject, buildMetaDataObject, buildParametersObject, YamlBlueprint } from './yaml-blueprint';

export interface Options extends ParentOptions {
  /**
   * What do you want to call your new blueprint?
   * @validationRegex /^[a-z-]+$/
   * @validationMessage Can only contain lowercase alphabetic characters or '-'
   */
  blueprintName: string;

  /**
   * Override the publishing organization. This is probably your code.aws organization's name.
   * @validationRegex .*
   */
  organizationOverride: string;

  /**
   * Add a description for your new blueprint.
   * @validationRegex .*
   */
  description?: string;

  /**
   * Who is the author of the blueprint?
   * @validationRegex /^[a-zA-Z0-9_]+$/
   * @validationMessage Must contain only upper and lowercase letters, numbers and underscores
   */
  authorName: string;

  /**
   * Create a new blueprint from an existing blueprint:
   * @validationRegex .*
   * @displayName Blueprint to extend
   */
  blueprintToExtend: string;

  /**
   * @collapsed true
   */
  advancedSettings?: {
    /**
     * Blueprint Version?
     * @validationRegex .*
     */
    version?: string;

    /**
     * License for your Blueprint
     */
    license: 'MIT' | 'Apache-2.0' | 'BSD-2-Clause' | 'BSD-3-Clause' | 'ISC' | 'MPL-2.0' | 'Unlicense' | 'Public-Domain';

    /**
     * Projen pinned version. Dont change unless you know what you're doing.
     * @validationRegex .*
     */
    projenVersion: string;
  };
}

export class Blueprint extends ParentBlueprint {
  protected options: Options & ParentOptions;
  protected newBlueprintOptions: ProjenBlueprintOptions;
  protected repository: SourceRepository;
  protected parentIntrospection: BlueprintIntrospection;
  protected builderOrganizationName: string;

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
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
        projenVersion: defaults.advancedSettings.projenVersion as any,
      },
    };
    const options = Object.assign(typeCheck, options_);
    this.options = options;

    this.parentIntrospection = this.doIntrospection();

    const YAML_ENABLED = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dashName = decamelize.default(this.options.blueprintName.toString()).replace(/_/g, '-');

    this.repository = new SourceRepository(this, {
      title: dashName,
    });
    console.log('repository:', this.repository.path);

    this.builderOrganizationName = this.options.organizationOverride || this.context.organizationName || '<<unknown-organization>>';
    const packageName = `@caws-blueprint/${this.builderOrganizationName}.${dashName}`;

    this.newBlueprintOptions = {
      authorName: this.builderOrganizationName,
      publishingOrganization: this.builderOrganizationName,
      packageName,
      name: dashName,
      displayName: this.options.blueprintName,
      defaultReleaseBranch: 'main',
      license: this.options.advancedSettings?.license,
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
      copyrightOwner: this.builderOrganizationName || 'unknown',
      deps: [
        this.options.blueprintToExtend,
        'projen',
        '@caws-blueprint-component/caws-workflows',
        '@caws-blueprint-component/caws-source-repositories',
      ],
      description: `${this.options.description}`,

      devDeps: ['ts-node', 'typescript', '@caws-blueprint-util/projen-blueprint', '@caws-blueprint-util/blueprint-cli'],
      keywords: ['<<tags>>'],
      homepage: '',
      mediaUrls: [
        'https://w7.pngwing.com/pngs/147/242/png-transparent-amazon-com-logo-amazon-web-services-amazon-elastic-compute-cloud-amazon-virtual-private-cloud-cloud-computing-text-orange-logo.png',
      ],
    };
    console.log('New blueprint options:', JSON.stringify(this.newBlueprintOptions, null, 2));

    if (YAML_ENABLED) {
      this.buildYamlComponents();
    } else {
      this.buildTypescriptComponents();
    }
  }

  private buildYamlComponents(): void {
    const yamlObject: YamlBlueprint = {
      Info: buildMetaDataObject({
        introspection: this.parentIntrospection,
        metadata: {
          DisplayName: this.newBlueprintOptions.name,
          Description: this.options.description || '',
          Package: this.newBlueprintOptions.packageName || 'no-packagename-found',
          Version: '0.0.0',
          Author: this.builderOrganizationName,
          Organization: this.builderOrganizationName,
          License: this.options.advancedSettings?.license || 'no-license-found',
        },
      }),
      Parameters: buildParametersObject(this.parentIntrospection.options.nodes),
      Generation: buildGenerationObject({
        parent: this.options.blueprintToExtend,
        version: this.options.advancedSettings?.version || 'latest',
        parameters: this.parentIntrospection.options.nodes,
      }),
    };

    // write the yaml file:
    new YamlFile(this, `${this.repository.relativePath}/blueprint.yaml`, {
      readonly: false,
      marker: false,
      obj: yamlObject,
    });
  }

  private buildTypescriptComponents(): void {
    const tsNodeVersion = 'ts-node@^10';
    const blueprint = new ProjenBlueprint({
      outdir: this.repository.relativePath,
      parent: this,
      mediaUrls: ['media-urls-that-have-to-do-with-your-blueprint'],
      displayName: 'Your Blueprint Display Name',
      publishingOrganization: 'Your Publishing Organization',
      ...this.newBlueprintOptions,
      overridePackageVersion: '0.0.0',
    });
    blueprint.addDevDeps(`projen@${this.options.advancedSettings?.projenVersion}`);
    blueprint.addDevDeps(tsNodeVersion);
    // create the projenrc.ts
    new SourceFile(
      this.repository,
      '.projenrc.ts',
      [
        "import { ProjenBlueprint } from '@caws-blueprint-util/projen-blueprint';",
        '',
        `const project = new ProjenBlueprint(${JSON.stringify(this.newBlueprintOptions, null, 2)});`,
        `project.package.addDevDeps('${tsNodeVersion}');`,
        '',
        'project.synth();',
      ].join('\n'),
    );

    // create the blueprint.ts
    new SourceFile(this.repository, 'src/blueprint.ts', buildBlueprint(this.parentIntrospection, this.options.blueprintToExtend));
    // create the defaults.json
    new SourceFile(this.repository, 'src/defaults.json', JSON.stringify(this.parentIntrospection.defaults, null, 2));
    // create the index.ts
    new SourceFile(this.repository, 'src/index.ts', buildIndex());

    // set up assets sample assets folder:
    const mainpy = new StaticAsset('starter-assets/main.py');
    new SourceFile(this.repository, 'static-assets/main.py', mainpy.toString());

    new SourceFile(this.repository, '.nvmrc', 'v14.18.0');

    const gettingStarted = new StaticAsset('getting-started.md');
    new SourceFile(this.repository, 'GETTING_STARTED.md', gettingStarted.toString());

    const readme = new StaticAsset('starter-readme.md');
    new SourceFile(this.repository, 'README.md', readme.toString());
  }

  private doIntrospection(): BlueprintIntrospection {
    const unpack = 'tar -xzf *.tgz';
    const parentResolutionDirectory = 'temp';
    cp.execSync(`mkdir -p ${parentResolutionDirectory}`);
    cp.execSync(`npm pack ${this.options.blueprintToExtend} && ${unpack}`, {
      cwd: parentResolutionDirectory,
      stdio: 'inherit',
      env: {
        ...process.env,
        NPM_CONFIG_ALWAYS_AUTH: 'true',
        NPM_CONFIG_TOKEN: this.context.npmConfiguration.token,
        NPM_CONFIG_REGISTRY: this.context.npmConfiguration.registry,
      },
    });

    const sourceBlueprintLocation = path.resolve(parentResolutionDirectory, 'package', 'lib/blueprint.d.ts');
    const defaultsLocation = path.resolve(parentResolutionDirectory, 'package', 'lib/defaults.json');
    const packageJsonLocation = path.resolve(parentResolutionDirectory, 'package', 'package.json');
    const readmeLocation = path.resolve(parentResolutionDirectory, 'package', 'README.md');

    const introspection = introspectBlueprint({
      sourceBlueprintLocation,
      defaultsLocation,
      packageJsonLocation,
      readmeLocation,
    });
    cp.execSync(`rm -rf ${parentResolutionDirectory}`);
    return introspection;
  }
}
