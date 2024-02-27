import * as fs from 'fs';
import { Environment, EnvironmentDefinition, AccountConnection, Role } from '@amazon-codecatalyst/blueprint-component.environments';
import { Issue } from '@amazon-codecatalyst/blueprint-component.issues';
import { Secret, SecretDefinition } from '@amazon-codecatalyst/blueprint-component.secrets';
import { SourceRepository, SourceFile } from '@amazon-codecatalyst/blueprint-component.source-repositories';
import { Workflow, NodeWorkflowDefinitionSamples } from '@amazon-codecatalyst/blueprint-component.workflows';
import {
  BlueprintInstantiation,
  MultiSelect,
  Blueprint as ParentBlueprint,
  Options as ParentOptions,
  Selector,
  Tuple,
} from '@amazon-codecatalyst/blueprints.blueprint';
import defaults from './defaults.json';

/**
 * This is the 'Options' interface. The 'Options' interface is interpreted by the wizard to dynamically generate a selection UI.
 * 1. It MUST be called 'Options' in order to be interpreted by the wizard
 * 2. This is how you control the fields that show up on a wizard selection panel. Keeping this small leads to a better user experience.
 * 3. You can use JSDOCs and annotations such as: '?', @advanced, @hidden, @display - textarea, etc. to control how the wizard displays certain fields.
 * 4. All required members of 'Options' must be defined in 'defaults.json' to synth your blueprint locally
 * 5. The 'Options' member values defined in 'defaults.json' will be used to populate the wizard selection panel with default values
 * @requires @amazon-codecatalyst/blueprints.sam-serverless-application
 * @requires @amazon-codecatalyst/blueprints.blueprint-builder
 */
export interface Options extends ParentOptions {
  /**
   * @collapsed
   */
  selectors?: {
    /**
     * This is a selector that allows me to get a source repository
     */
    sourceRepo?: Selector<SourceRepository>;

    /**
     * This is a selector that allows me to get a source repository or enter a string
     */
    sourceRepoOrAdd?: Selector<SourceRepository | string>;

    /**
     * This is a selector that allows me to get a instantiation
     */
    blueprintInstantiation?: Selector<BlueprintInstantiation>;
  };
  /**
   * @collapsed
   */
  multiSelectors?: {
    stringMulti: MultiSelect<'First option' | 'A' | 'B' | 'B' | 'C'>;
    numberMulti: MultiSelect<1 | 10 | 100 | 9999>;
    /**
     * This allows you to select one or more of any of the existing source repos in the project
     */
    sourceMulti?: MultiSelect<SourceRepository>;

    /**
     * This allows you to select one or more of any of the existing BlueprintInstantiations in the project
     */
    instantiationMulti?: MultiSelect<BlueprintInstantiation>;
  };

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

  /**
   * This is some information about what type of environment and what in the world an environment is.
   * @displayName This is the Environment Title Area
   * @collapsed
   * @showName true
   * @showEnvironmentType true
   */
  thisIsMyEnvironment: EnvironmentDefinition<{
    /**
     * blah blah blah some comments about the account that i'm deploying into
     * @displayName This account connection has an overriden name
     * @collapsed
     */
    thisIsMyFirstAccountConnection: AccountConnection<{
      /**
       * Blah blah some information about the role that I expect
       * e.g. here's a copy-pastable policy: [to a link]
       * @displayName This role has an overriden name
       */
      adminRole: Role<['admin', 'lambda', 's3', 'cloudfront']>;
      /**
       * Blah blah some information about the second role that I expect
       * e.g. here's a copy-pastable policy: [to a link]
       */
      lambdaRole: Role<['lambda', 's3']>;
    }>;
    /**
     * blah blah blah some comments about the account that i'm deploying into
     */
    thisIsMySecondAccountConnection: AccountConnection<{
      /**
       * Blah blah some information about the role that I expect
       * e.g. here's a copy-pastable policy: [to a link]
       */
      secondAdminRole: Role<['admin', 'lambda', 's3', 'cloudfront']>;
      /**
       * Blah blah some information about the second role that I expect
       * e.g. here's a copy-pastable policy: [to a link]
       */
      secondLambdaRole: Role<['lambda', 's3']>;
    }>;
  }>;

  /**
   * This is a regular string input field.
   * 1. It's display has been overriden to 'new stringinput display name' from 'stringInput'
   * 2. It should be a required field
   * 3. It should be collapsed by default
   * 4. The default value should have entropy of length 5 appended to it
   * @displayName 'new input display name'
   * @validationRegex .*
   * @collapsed
   * @defaultEntropy 5
   */
  stringInput: string;

  /**
   * This is a converts a string input field to a text area for larger bodies of text.
   * number sets how many rows, default is 5.
   * @textArea 15
   * @validationRegex .*
   */
  textAreaInput: string;

  /**
   * This is a regular enum input field with an override display name.
   * @displayName 'Runtime Languages'
   */
  runtimes: 'nodejs' | 'python' | 'java' | 'dotnetcore' | 'ruby';

  /**
   * This is a regular number input field.
   * 1. It's display has been overriden to 'new numberInput display name' from 'numberInput'
   * 2. It should be a required field
   * 3. It should be collapsed by default
   * @displayName 'new input display name'
   * @collapsed
   */
  numberInput: number;

  optionalNumberInput?: number;

  /**
   * This is a nested object input field.
   * collapsed open by default. Not overriding the display name
   * @collapsed false
   */
  nestedArea: {
    /**
     * This is a regular string input field.
     * @displayName 'overriden input display name for nested object'
     * @validationRegex .*
     */
    stringInput: string;

    /**
     * @validationRegex .*
     */
    emptyInput: string;

    /**
     * Hidden input.
     * @hidden true
     * @validationRegex .*
     */
    nestedHiddenInput: string;
  };

  /**
   * String list input
   * @validationRegex .*
   */
  stringListInput?: string[];

  /**
   * This should be checked by default
   */
  trueCheckbox: boolean;

  /**
   * This converts a boolean into a button
   * @button
   */
  button: boolean;

  /**
   * Hidden input.
   * @hidden true
   * @validationRegex .*
   */
  hiddenInput: string;

  /**
   * Hidden input.
   * @hidden
   * @validationRegex .*
   */
  hiddenInputNoBoolean: string;

  /**
   * Hidden input.
   * @hidden true
   * @validationRegex /cantfind/
   */
  hiddenInputInvalid: string;

  /**
   * Pascal Case Regex.
   * @validationRegex /^[A-Z][A-Za-z]{4,24}$/
   */
  pascalCaseRegex: string;

  secret: SecretDefinition;
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
      runtimes: defaults.runtimes as Options['runtimes'],
    };
    const options = Object.assign(typeCheck, options_);

    options.thisIsMyEnvironment.thisIsMyFirstAccountConnection;

    // add a repository
    const repo = new SourceRepository(this, { title: 'code' });

    // example showing add files to the repository
    // assets get synth'd from the 'assets' folder. At synth time, the asset folder is a sibling of the blueprint.ts.
    new SourceFile(repo, 'wizard_input.json', JSON.stringify(options, null, 2));
    new Workflow(this, repo, NodeWorkflowDefinitionSamples.build);
    new Environment(this, options.thisIsMyEnvironment);
    new Secret(this, options.secret);

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
    new SourceFile(internalRepo, 'internal/blueprint-instantiation.json', JSON.stringify(this.context.project.blueprint || {}, null, 2));

    new SourceFile(internalRepo, 'internal/INSTANTIATIONS_ABS.json', JSON.stringify(this.context.project.blueprint, null, 2));

    new Issue(this, 'myFirstIssue', {
      title: 'myFirstIssue',
      content: 'this is an example issue',
    });

    new Issue(this, 'mySecondIssue', {
      title: 'mySecondIssue',
      content: 'this is an example high priority issue',
      priority: 'HIGH',
    });
    new Issue(this, 'myThirdIssue', {
      title: 'myThirdIssue',
      content: 'this is an example of a low priority issue with a label',
      priority: 'LOW',
      labels: ['exampleLabel'],
    });
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
