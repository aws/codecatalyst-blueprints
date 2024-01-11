import * as fs from 'fs';
// import { Environment } from '@amazon-codecatalyst/blueprint-component.environments';
import { SourceRepository, SourceFile } from '@amazon-codecatalyst/blueprint-component.source-repositories';
import { Workflow, NodeWorkflowDefinitionSamples } from '@amazon-codecatalyst/blueprint-component.workflows';
import { Blueprint as ParentBlueprint, Options as ParentOptions } from '@amazon-codecatalyst/blueprints.blueprint';
import defaults from './defaults.json';

/**
 * We expose the touple type because typescript will treat defaulted touples as string[];
 */
type SupportedTupleType = string | number;

/**
 * This returns a string[] of length 2
 */
export type Tuple<T extends [SupportedTupleType, SupportedTupleType]> = T | SupportedTupleType[];

/**
 * This is the 'Options' interface. The 'Options' interface is interpreted by the wizard to dynamically generate a selection UI.
 * 1. It MUST be called 'Options' in order to be interpreted by the wizard
 * 2. This is how you control the fields that show up on a wizard selection panel. Keeping this small leads to a better user experience.
 * 3. You can use JSDOCs and annotations such as: '?', @advanced, @hidden, @display - textarea, etc. to control how the wizard displays certain fields.
 * 4. All required members of 'Options' must be defined in 'defaults.json' to synth your blueprint locally
 * 5. The 'Options' member values defined in 'defaults.json' will be used to populate the wizard selection panel with default values
 * @requires @amazon-codecatalyst/blueprints.blueprint-builder
 * @requires @amazon-codecatalyst/blueprints.sam-serverless-application
 */
export interface Options extends ParentOptions {
  /**
   * These are touple parings.
   * @collapsed
   */
  toupleValues?: {
    /**
     * Only Touples of length 2 are supported
     */
    singles: {
      /**
       * empty tuple map. This should default to string:string
       * @validationRegex /^[a-zA-Z0-9]{1,50}$/
       */
      emptyTouple?: Tuple<[string, number]>;

      /**
       * Traditional string to string mapping explictly
       * @description overall description
       * @validationRegex /^[a-zA-Z0-9]{1,50}$/
       */
      doubleTouple: Tuple<[string, string]>;

      /**
       * @validationRegex /^[a-zA-Z0-9]{1,50}$/
       */
      doubleToupleNum: Tuple<[string, number]>;
    };

    lists: {
      /**
       * Traditional string to string mapping explictly
       * @description overall description
       * @validationRegex /^[a-zA-Z0-9]{1,50}$/
       */
      doubleTouple: Tuple<[string, string]>[];
      /**
       * @validationRegex /^[a-zA-Z0-9]{1,50}$/
       */
      doubleToupleNum: Tuple<[string, number]>[];
    };
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
      // runtimes: defaults.runtimes as Options['runtimes'],
    };
    const options = Object.assign(typeCheck, options_);

    // options.thisIsMyEnvironment.thisIsMyFirstAccountConnection;

    // add a repository
    const repo = new SourceRepository(this, { title: 'code' });

    // example showing add files to the repository
    // assets get synth'd from the 'assets' folder. At synth time, the asset folder is a sibling of the blueprint.ts.
    new SourceFile(repo, 'wizard_input.json', JSON.stringify(options, null, 2));
    new Workflow(this, repo, NodeWorkflowDefinitionSamples.build);
    // new Environment(this, options.thisIsMyEnvironment);

    // showcase the blueprint's own source files
    const blueprintInterface = fs.readFileSync('./lib/blueprint.d.ts').toString();
    const blueprintDefaults = fs.readFileSync('./lib/defaults.json').toString();
    const blueprintAST = fs.readFileSync('./lib/ast.json').toString();

    const internalRepo = new SourceRepository(this, { title: 'showcase-info' });

    // easy copying of static files
    internalRepo.copyStaticFiles({
      from: 'subdirectory/in/static/assets',
      to: 'subdirectory/in/my/repo',
    });

    new SourceFile(internalRepo, 'blueprint.d.ts', blueprintInterface);
    new SourceFile(internalRepo, 'defaults.json', blueprintDefaults);
    new SourceFile(internalRepo, 'internal/ast.json', blueprintAST);
    new SourceFile(internalRepo, 'internal/env.json', JSON.stringify(process.env, null, 2));

    new SourceFile(internalRepo, 'internal/INSTANTIATIONS_ABS.json', JSON.stringify(this.context.project.blueprint.instantiations, null, 2));
  }

  async synth(): Promise<void> {
    console.log('did async thing');
    const asyncRepo = new SourceRepository(this, { title: 'async-repo' });
    new SourceFile(asyncRepo, 'async-env.json', JSON.stringify(process.env, null, 2));
    console.log('finished async thing');

    // make sure you call super.synth() at the end!
    super.synth();
  }
}
