import * as cp from 'child_process';
import { SourceRepository } from '@caws-blueprint-component/caws-source-repositories';

import { Blueprint as ParentBlueprint, Options as ParentOptions } from '@caws-blueprint/caws.blueprint';
import defaults from './defaults.json';

/**
 * This is the 'Options' interface. The 'Options' interface is interpreted by the wizard to dynamically generate a selection UI.
 * 1. It MUST be called 'Options' in order to be interpreted by the wizard
 * 2. This is how you control the fields that show up on a wizard selection panel. Keeping this small leads to a better user experience.
 * 3. You can use JSDOCs and annotations such as: '?', @advanced, @hidden, @display - textarea, etc. to control how the wizard displays certain fields.
 */
export interface Options extends ParentOptions {
  /**
   * Which Git repository do we clone? This should be a https URL.
   */
  gitRepository: string;

  /**
   * Specifies the branch we're cloning from
   * @advanced
   */
  branch?: string;
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
    const options = Object.assign(defaults, options_);
    console.log(options);

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

    cp.execSync(`git clone ${this.giturl} ./`, {
      cwd: this.repo.path,
    });
  }
}
