import { Environment } from './tmp-env-def/environment-component';
import { EnvironmentDefinition, AccountConnection, Role } from './tmp-env-def/environment-definition';
import { SourceRepository, SourceFile } from '@caws-blueprint-component/caws-source-repositories';
import { Workflow, NodeWorkflowDefinitionSamples } from '@caws-blueprint-component/caws-workflows';
import { Blueprint as ParentBlueprint, Options as ParentOptions } from '@caws-blueprint/blueprints.blueprint';
import defaults from './defaults.json';

// Sample imports:

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
   * The name of an environment
   */
  thisIsMyEnvironment: EnvironmentDefinition<{
    /**
     * blah blah blah some comments about the account that i'm deploying into
     * @displayName primaryAccount
     */
    thisIsMyFirstAccountConnection: AccountConnection<{
      /**
       * This role requires read and write access to 'admin'
       * e.g. here's a copy-pastable policy: [to a link]
       */
      adminRole: Role<['admin', 'lambda', 's3', 'cloudfront']>;
      /**
       * This role requires read and write access to 's3', 'cloudfront'
       * e.g. here's a copy-pastable policy: [to a link]
       */
      lambdaRole: Role<['lambda', 's3']>;
    }>;

    thisIsMySecondAccountConnection: AccountConnection<{
      /**
       * This role requires read and write access to 'admin'
       * e.g. here's a copy-pastable policy: [to a link]
       * @displayName YetAnotherAdminRole
       */
      anotherAdminRole: Role<['admin', 'dynamodb']>;
      /**
       * This role requires read and write access to 's3', 'cloudfront'
       * e.g. here's a copy-pastable policy: [to a link]
       */
      anotherLambdaRole: Role<['lambda', 's3']>;
    }>;
  }>;

  /**
   * This is a regular string input field.
   * 1. It's display has been overriden to 'new stringinput display name' from 'stringInput'
   * 2. It should be a required field
   * 3. It should be collapsed by default
   * 4. The default value should have entropy of length 5 appended to it
   * @displayName 'new input display name'
   * @collapsed
   * @defaultEntropy 5
   */
  stringInput: string;

  /**
    * This is a regular number input field.
    * 1. It's display has been overriden to 'new numberInput display name' from 'numberInput'
    * 2. It should be a required field
    * 3. It should be collapsed by default
    * @displayName 'new input display name'
    * @collapsed
    */
  numberInput: number;
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

    const options = {
      ...defaults,
      ...options_,
    };


    // add a repository
    new Environment(this, options.thisIsMyEnvironment);

    const repo = new SourceRepository(this, { title: 'code' });

    // example showing add files to the repository
    // assets get synth'd from the 'assets' folder. At synth time, the asset folder is a sibling of the blueprint.ts.
    new SourceFile(repo, 'wizard_input.json', JSON.stringify(options, null, 2));
    new Workflow(this, repo, NodeWorkflowDefinitionSamples.build);
  }
}
