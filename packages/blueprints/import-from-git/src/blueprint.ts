import * as cp from 'child_process';
import { SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
import * as fs from 'fs';
import * as path from 'path';
import {
  Blueprint as ParentBlueprint,
  Options as ParentOptions,
  BlueprintSynthesisError as SynthError,
  BlueprintSynthesisErrorTypes as SynthErrorTypes,
} from '@caws-blueprint/blueprints.blueprint';

import defaults from './defaults.json';

//200mb
const max_repo_mb = 200;
const MAX_REPO_SIZE = max_repo_mb * (1024 * 1024);

/**
 * This is the 'Options' interface. The 'Options' interface is interpreted by the wizard to dynamically generate a selection UI.
 * 1. It MUST be called 'Options' in order to be interpreted by the wizard
 * 2. This is how you control the fields that show up on a wizard selection panel. Keeping this small leads to a better user experience.
 * 3. You can use JSDOCs and annotations such as: '?', @advanced, @hidden, @display - textarea, etc. to control how the wizard displays certain fields.
 * 4. All required members of 'Options' must be defined in 'defaults.json' to synth your blueprint locally
 * 5. The 'Options' member values defined in 'defaults.json' will be used to populate the wizard selection panel with default values
 */
export interface Options extends ParentOptions {
  /**
   * Which Git repository do we clone? This should be a https URL.
   * @validationRegex /^https://[a-zA-Z0-9_/.-]+$/
   * @validationMessage Git repository URL must start with https:// and contain only alphanumeric characters, dashes (-), periods (.), underscores, and forward slashes (/).
   */
  gitRepository: string;
}

/**
 * This is the actual blueprint class.
 * 1. This MUST be the only 'class' exported, as 'Blueprint'
 * 2. This Blueprint should extend another ParentBlueprint
 */
export class Blueprint extends ParentBlueprint {
  repo: SourceRepository;
  giturl: string;

  constructor(options_: Options) {
    super(options_);

    console.log(defaults);
    // helpful typecheck for defaults
    const typeCheck: Options = {
      outdir: this.outdir,
      ...defaults,
    };
    const options = Object.assign(typeCheck, options_);

    const gitRepositoryName = options.gitRepository.split('/').pop()?.replace('.git', '');
    console.log(gitRepositoryName);

    this.repo = new SourceRepository(this, {
      title: gitRepositoryName || 'could-not-derive-git-name',
    });

    this.giturl = options.gitRepository;
  }

  override synth(): void {
    super.synth();
    this.components.forEach(component => {
      component.synthesize();
    });

    try {
      cp.execSync(`git clone --depth 1 ${this.giturl} ./`, {
        cwd: this.repo.path,
      });
    } catch (e) {
      this.throwSynthesisError(
        new SynthError({
          message: `Repository ${this.giturl} not found`,
          type: SynthErrorTypes.NotFoundError,
        }),
      );
    }

    try {
      const repoSize = this.getRepoSize();
      if (repoSize > MAX_REPO_SIZE) {
        this.throwSynthesisError(
          new SynthError({
            message: `Repository size is greater than max allowed of ${max_repo_mb} MB`,
            type: SynthErrorTypes.ValidationError,
          }),
        );
      }
    } catch (e) {
      throw e;
    }
  }

  getRepoSize(): number {
    let repoSize = 0;
    repoSize += this.getFolderSize(this.repo.path);
    return repoSize;
  }

  //recursively get the size of each folder and files in the repo tree
  getFolderSize(folderPath: string): number {
    let folderSize = 0;
    let fileSizes = 0;
    const folderStats = fs.statSync(folderPath);
    const filesAndFolders = fs.readdirSync(folderPath);
    for (const f of filesAndFolders) {
      const fPath = path.join(folderPath, f);
      const stats = fs.statSync(fPath);
      if (stats.isDirectory()) {
        folderSize += this.getFolderSize(fPath);
      } else {
        fileSizes += stats.size;
      }
    }
    folderSize += folderStats.size + fileSizes;
    return folderSize;
  }
}
