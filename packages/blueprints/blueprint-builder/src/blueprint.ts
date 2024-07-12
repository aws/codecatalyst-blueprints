import { SourceRepository } from '@amazon-codecatalyst/blueprint-component.source-repositories';

import { Workflow, WorkflowBuilder } from '@amazon-codecatalyst/blueprint-component.workflows';

import { MergeStrategies, Blueprint as ParentBlueprint, Options as ParentOptions, Selector } from '@amazon-codecatalyst/blueprints.blueprint';

import * as decamelize from 'decamelize';
import { buildBlueprintPackage } from './build-blueprint-package';
import { buildInitialStaticAssets } from './build-initial-static-assets';
import { buildReleaseWorkflow } from './build-release-workflow';
import defaults from './defaults.json';

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
   * Homepage url for your new blueprint.
   * @validationRegex .*
   */
  homepage?: string;

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
     * If set during intial creation, this converts the repository into a blueprint.
     * @displayName Source Repository
     */
    repository?: Selector<SourceRepository>;

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
  isBlueprintConversion: boolean = false;

  constructor(options_: Options) {
    super({
      ...options_,
    });
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
    const userSelectedOptions = Object.assign(typeCheck, options_);

    const spaceName = process.env.CONTEXT_SPACENAME || '<<unknown-space>>';
    const dashName = decamelize.default(options_.blueprintName.toString()).replace(/[_ ]/g, '-');
    const defaultPackageName = `@amazon-codecatalyst/${spaceName}.${dashName}`.substring(0, 214).toLocaleLowerCase().replace(/[_ ]/g, '-');
    const options = {
      ...userSelectedOptions,
      advancedSettings: {
        ...userSelectedOptions.advancedSettings,
        blueprintPackageName: userSelectedOptions.advancedSettings.blueprintPackageName || defaultPackageName,
        repository: userSelectedOptions.advancedSettings.repository || dashName,
      },
    };

    this.setInstantiation({
      options,
      description: options.description,
    });

    /**
     * Create a new Source repo
     */
    this.repository = new SourceRepository(this, {
      title: options.advancedSettings.repository,
    });

    /**
     * Builds the assets for the basic blueprint npm package
     */
    buildBlueprintPackage(this, this.repository, {
      bpOptions: options,
      space: this.context.spaceName || 'unknown',
      packageName: options.advancedSettings.blueprintPackageName,
      dashname: dashName,
    });

    /**
     * If the release option is set, respect that and build a release workflow
     */
    if (options.advancedSettings.releaseWorkflow) {
      new Workflow(
        this,
        this.repository,
        buildReleaseWorkflow(new WorkflowBuilder(this), {
          includePublishStep: options.advancedSettings.includePublishingAction,
        }).getDefinition(),
      );
      this.repository.copyStaticFiles({
        from: 'release',
      });
    }

    /**
     * this is the first time this blueprint is being applied, and its being applied to a repository that already exists.
     * this blueprint is being added as a conversion on an existing codebase.
     */
    if (!this.context.project.blueprint.instantiationId && userSelectedOptions.advancedSettings.repository) {
      console.log('CONVERTING A BLUEPRINT!!!');
      this.isBlueprintConversion = true;
      buildInitialStaticAssets(this.repository, {
        existingFiles: this.context.project.src.findAll({
          repositoryName: this.repository.title,
        }),
      });

      this.repository.copyStaticFiles({
        from: 'converted-blueprint',
      });
      this.repository.setResynthStrategies([
        {
          identifier: 'inital_conversion',
          strategy: (_commonAncestorFile, _existingFile, proposedFile) => proposedFile,
          globs: ['**/**'],
        },
      ]);
    } else {
      /**
       * Otherwise use the standard static assets
       */
      this.repository.copyStaticFiles({
        from: 'standard-static-assets',
        to: 'static-assets',
      });
      this.setStandardResynthStrategies();
    }
  }

  /**
   * This is the standard way we deal with resynthesis
   */
  setStandardResynthStrategies() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  }
}
