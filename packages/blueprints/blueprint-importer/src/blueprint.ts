import * as fs from 'fs';
import { Environment } from '@amazon-codecatalyst/blueprint-component.environments';
import { SourceRepository, SourceFile } from '@amazon-codecatalyst/blueprint-component.source-repositories';
import { Workflow, NodeWorkflowDefinitionSamples, WorkflowBuilder } from '@amazon-codecatalyst/blueprint-component.workflows';
import { Blueprint as ParentBlueprint, Options as ParentOptions } from '@amazon-codecatalyst/blueprints.blueprint';
import defaults from './defaults.json';

export interface Options extends ParentOptions {
  /**
   * Will attempt to import these NPM packages as blueprints.
   * @displayName Package Name
   */
  packages: string[];

  /**
  * @collapsed
  */
  advanced: {
    /**
     * NPM registry that is set as upstream
     * @placeholder https://registry.npmjs.org
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
    const repo = new SourceRepository(this, { title: 'blueprint-importer' });
    repo.copyStaticFiles({
      from: 'importer-start',
    });

    options.packages.forEach(npmPackage => {
      const workflow = new WorkflowBuilder(this);
      workflow.addTrigger({} as any);


      new Workflow(this, repo, NodeWorkflowDefinitionSamples.build);
    });
  }
}
