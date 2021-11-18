/* eslint-disable @typescript-eslint/no-unused-vars */
import * as cp from 'child_process';
// import * as fs from 'fs';
import * as path from 'path';

import { SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
import { ProjenBlueprint, ProjenBlueprintOptions } from '@caws-blueprint-util/blueprint-projen';
import {
  buildBlueprint,
  buildIndex,
} from '@caws-blueprint-util/blueprint-utils';
import {
  Blueprint as ParentBlueprint,
  Options as ParentOptions,
} from '@caws-blueprint/caws.blueprint';

// import * as camelcase from 'camelcase';
import * as decamelize from 'decamelize';
// import { TypeScriptProject, YamlFile, TextFile } from 'projen';
import { YamlFile, TextFile, SourceCode } from 'projen';

import { BlueprintIntrospection, introspectBlueprint } from './introspect-blueprint';
import { buildGenerationObject, buildMetaDataObject, buildParametersObject, YamlBlueprint } from './yaml-blueprint';

export interface Options {
  /**
   * Create a new blueprint from an existing blueprint:
   * @optional
   * @displayName Blueprint to extend
   */
  blueprintToExtend: string;

  /**
   * Who is the author of the blueprint?
   */
  authorName: string;

  /**
   * Blueprint Version?
   */
  version?: string;

  /**
   * What do you want to call your new blueprint?
   */
  blueprintName: string;

  /**
   * Add a description for your new blueprint.
   */
  description?: string;

  /**
   * Would you like to build this as yaml?
   */
  yaml?: boolean;

  /**
   * Tags for your Blueprint:
   */
  tags?: string[];

  /**
   * License for your Blueprint
   * @advanced
   */
  license: 'MIT' | 'Apache-2.0' | 'BSD-2-Clause' | 'BSD-3-Clause' | 'ISC' | 'MPL-2.0' | 'Unlicense' | 'Public-Domain';
}

export class Blueprint extends ParentBlueprint {
  protected options: Options & ParentOptions;
  protected newBlueprintOptions: ProjenBlueprintOptions;
  protected repository: SourceRepository;
  protected parentIntrospection: BlueprintIntrospection;

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(options_: Options & ParentOptions) {
    super(options_);
    this.options = options_;

    this.parentIntrospection = this.doIntrospection();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dashName = decamelize.default(this.options.blueprintName.toString()).replace(/_/g, '-');

    this.repository = new SourceRepository(this, {
      title: dashName,
    });
    console.log('repository:', this.repository.path);

    const packageName = `@caws-blueprint/${this.context.organizationName}.${dashName}`;

    // this.context.organizationName
    this.newBlueprintOptions = {
      defaultReleaseBranch: 'main',
      name: dashName,
      displayName: this.options.blueprintName,
      authorName: this.context.organizationName,
      license: this.options.license,
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
      copyrightOwner: this.context.organizationName || 'unknown',
      deps: [
        this.options.blueprintToExtend,
        '@caws-blueprint-component/caws-workflows',
        '@caws-blueprint-component/caws-source-repositories',
      ],
      description: `${this.options.description}`,
      packageName,
      publishingOrganization: this.context.organizationName,
      devDeps: [
        'ts-node',
        'typescript',
        '@caws-blueprint-util/blueprint-projen',
        '@caws-blueprint-util/blueprint-cli',
      ],
      keywords: this.options.tags || ['no-tag'],
      homepage: '',
      mediaUrls: ['https://w7.pngwing.com/pngs/147/242/png-transparent-amazon-com-logo-amazon-web-services-amazon-elastic-compute-cloud-amazon-virtual-private-cloud-cloud-computing-text-orange-logo.png'],
    };
    console.log('New blueprint options:', JSON.stringify(this.newBlueprintOptions, null, 2));

    if (this.options.yaml) {
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
          Author: this.context.organizationName || 'no-organization-found',
          Organization: this.context.organizationName || 'no-organization-found',
          License: this.options.license,
        },
      }),
      Parameters: buildParametersObject(this.parentIntrospection.options.nodes),
      Generation: buildGenerationObject({
        parent: this.options.blueprintToExtend,
        version: this.options.version || 'latest',
        parameters: this.parentIntrospection.options.nodes,
      }),
    };

    // write the README file:
    new TextFile(this, `${this.repository.relativePath}/README.md`, {
      readonly: false,
      lines: this.parentIntrospection.readmeContent.split('\n'),
    });

    // write the yaml file:
    new YamlFile(this, `${this.repository.relativePath}/blueprint.yaml`, {
      readonly: false,
      marker: false,
      obj: yamlObject,
    });
  }

  private buildTypescriptComponents(): void {
    const blueprint = new ProjenBlueprint({
      outdir: this.repository.relativePath,
      parent: this,
      ...this.newBlueprintOptions,
      overridePackageVersion: '0.0.0',
    });

    const rcfile = new SourceCode(blueprint, '.projenrc.ts');
    rcfile.line('import { ProjenBlueprint } from \'@caws-blueprint-util/blueprint-projen\';');
    rcfile.line('');
    rcfile.line(`const project = new ProjenBlueprint(${JSON.stringify(this.newBlueprintOptions, null, 2)});`);
    rcfile.line('');
    rcfile.line('project.synth();');

    const blueprintFile = new SourceCode(blueprint, 'src/blueprint.ts');
    buildBlueprint(this.parentIntrospection, this.options.blueprintToExtend).split('\n').forEach(line => {
      blueprintFile.line(line);
    });

    const indexFile = new SourceCode(blueprint, 'src/index.ts');
    buildIndex().split('\n').forEach(line => {
      indexFile.line(line);
    });

    const defaults = new SourceCode(blueprint, 'src/defaults.json');
    defaults.line(`${JSON.stringify(this.parentIntrospection.defaults, null, 2)}`);

    new TextFile(blueprint, path.join('README.md'), {
      readonly: false,
      lines: this.parentIntrospection.readmeContent.split('\n'),
    });
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

    const sourceBlueprintLocation = path.resolve(
      parentResolutionDirectory,
      'package',
      'lib/blueprint.d.ts',
    );
    const defaultsLocation = path.resolve(
      parentResolutionDirectory,
      'package',
      'lib/defaults.json',
    );

    const packageJsonLocation = path.resolve(
      parentResolutionDirectory,
      'package',
      'package.json',
    );

    const readmeLocation = path.resolve(
      parentResolutionDirectory,
      'package',
      'README.md',
    );

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
