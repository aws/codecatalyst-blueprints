import { SampleWorkspaces, Workspace, WorkspaceDefinition } from '@amazon-codecatalyst/blueprint-component.dev-environments';
import { Environment, EnvironmentDefinition, AccountConnection, Role } from '@amazon-codecatalyst/blueprint-component.environments';
import { SourceRepository } from '@amazon-codecatalyst/blueprint-component.source-repositories';
import { Workflow, WorkflowBuilder, convertToWorkflowEnvironment } from '@amazon-codecatalyst/blueprint-component.workflows';
import { Blueprint as ParentBlueprint, Options as ParentOptions } from '@amazon-codecatalyst/blueprints.blueprint';
import defaults from './defaults.json';

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
   * An environment is somewhere to deploy code.
   * This is optional
   * @displayName This is the Environment Title Area
   */
  environment?: EnvironmentDefinition<{
    /**
     * I can connect my aws account via an environment.
     * I can ask for multiple accounts per environment.
     * I can use this account connection on a workflow to deploy with.
     * @displayName This account connection has an overriden name
     */
    awsAccount: AccountConnection<{
      /**
       * Role on my aws account. I can ask for multiple roles per account.
       * e.g. here's a copy-pastable policy: [to a link]
       * @displayName This role has an overriden name
       */
      role: Role<[]>;
    }>;
  }>;

  /**
   * This is a nested area. It should be open by default
   *  @collapsed false
   */
  nested: {
    /**
     * This is a regular string input field.
     * 1. It's display has been overriden to 'new input display name' from 'stringInput'
     * 2. It should be a required field
     * 3. It should be collapsed by default
     * 4. The default value should have entropy of length 5 appended to it
     * 5. this field is marked with a '?' and so is optional
     * @displayName 'new input display name'
     * @validationRegex /^[a-zA-Z0-9_]+$/
     * @validationMessage Must contain only upper and lowercase letters, numbers and underscores
     * @defaultEntropy 5
     */
    stringInput?: string;
  };

  /**
   * This is a regular enum input field with an override display name.
   * This gets rendered as a dropdown.
   */
  dropdown: 'first-option' | 'second-option' | 'third-option' | 'fourth-option' | 'fifth-option';
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
      // typescript needs some help disambiguating enums
      dropdown: defaults.dropdown as Options['dropdown'],
    };
    const options = Object.assign(typeCheck, options_);

    // add a repository
    const repository = new SourceRepository(this, { title: 'code' });

    // add some code to my repository by copying everything in static-assets
    repository.copyStaticFiles({
      from: 'starter-code',
      to: './',
      substitute: {}, // optional used for {{mustache}} substitutions
      map: file => {
        let newPath = file.path;
        newPath = replaceEndWith(newPath, '_npmignore', '.npmignore');
        newPath = replaceEndWith(newPath, '_gitignore', '.gitignore');
        return {
          ...file,
          path: file.path,
        };
      },
    });

    // Copy files explicitly
    // StaticAsset.findAll('**').forEach(asset => {
    //   new SourceFile(repository, asset.path(), asset.content().toString());
    // });

    // create an environment, if I have one
    let environment: Environment | undefined = undefined;
    if (options.environment) {
      environment = new Environment(this, options.environment);
    }

    const workflowBuilder = new WorkflowBuilder(this);
    workflowBuilder.setName('this-is-my-first-workflow');
    workflowBuilder.addBranchTrigger(['main']);

    /**
     * We can use a build action to execute some arbitrary steps
     */
    workflowBuilder.addBuildAction({
      actionName: 'do-something-in-an-action',
      input: {
        Sources: ['WorkflowSource'],
      },
      steps: [
        'ls -la',
        'echo "Hello world from a workflow!"',
        'echo "If theres an account connection, I can execute in the context of that account"',
        'aws sts get-caller-identity',
      ],
      // is there is an environment, connect it to the workflow
      environment: environment && convertToWorkflowEnvironment(environment),
      output: {},
    });

    // write a workflow to my repository
    new Workflow(this, repository, workflowBuilder.getDefinition());

    // Create a dev environment workspace in my project
    const devEnvironementDefiniton: WorkspaceDefinition = SampleWorkspaces.default;
    new Workspace(this, repository, devEnvironementDefiniton);
  }
}

function replaceEndWith(str: string, occurance: string, replacement: string): string {
  if (str.endsWith(occurance)) {
    return str.substring(0, str.lastIndexOf(occurance)) + replacement;
  }
  return str;
}
