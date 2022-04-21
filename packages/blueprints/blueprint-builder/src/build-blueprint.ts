export interface BlueprintIntrospection {
  imports: string[];
  options: OptionsInformation;
  classInfo: ClassInformation;
  defaults: any;
}

interface ClassInformation {
  name: string;
}
interface OptionsInformation {
  fullSource: string;
}

export const buildBlueprint = (originBlueprint: BlueprintIntrospection, originPackage: string): string => {
  return `
import { SourceRepository, SourceFile, StaticAsset, SubstitionAsset } from '@caws-blueprint-component/caws-source-repositories';
import { emptyWorkflow, WorkflowDefinition, Workflow, addGenericBranchTrigger, addGenericBuildAction } from '@caws-blueprint-component/caws-workflows';
import { Blueprint as ParentBlueprint, Options as ParentOptions } from '${originPackage}';
import defaults from './defaults.json';

/**
 * This is the 'Options' interface. The 'Options' interface is interpreted by the wizard to dynamically generate a selection UI.
 * 1. It MUST be called 'Options' in order to be interpreted by the wizard
 * 2. This is how you control the fields that show up on a wizard selection panel. Keeping this small leads to a better user experience.
 * 3. You can use JSDOCs and annotations such as: '?', @advanced, @hidden, @display - textarea, etc. to control how the wizard displays certain fields.
 * 4. All required members of 'Options' must be defined in 'defaults.json' to synth your blueprint locally
 * 5. The 'Options' member values defined in 'defaults.json' will be used to populate the wizard selection panel with default values
 */
 ${originBlueprint.options.fullSource}

/**
 * This is the actual blueprint class.
 * 1. This MUST be the only 'class' exported, as 'Blueprint'
 * 2. This Blueprint should extend another ParentBlueprint
 */
export class Blueprint extends ParentBlueprint {
  constructor(options_: Options) {
    super(options_);
    console.log(defaults);
    /**
     * This is a typecheck to ensure that the defaults passed in are of the correct type.
     * There are some cases where the typecheck will fail, but the defaults will still be valid, such when using enums.
     * you can override this ex. myEnum: defaults.myEnum as Options['myEnum'],
     */
    const typeCheck: Options = {
      outdir: this.outdir,
      ...defaults,
    };
    const options = Object.assign(typeCheck, options_);
    console.log(options);

    // add a repository
    const repo = new SourceRepository(this, { title: 'MyRepo' });

    // copy all files in the static-assets folder, and add them to the repo as source files
    StaticAsset.findAll('**/*').forEach(staticCode => {
      new SourceFile(repo, staticCode.path(), staticCode.toString());
    });

    // authors can also use mustache subsitution with SubsitutionAsset
    // specifically target main.py and subsitute some values
    const mainpy = new SubstitionAsset('main.py');
    new SourceFile(repo, 'main.py', mainpy.subsitite({
      helloValue: 'My newly generated project',
    }));

    /**
     * Create a workflow that runs when code gets pushed to the 'main' branch of the repo
     * Docs: https://alpha.www.docs.aws.a2z.com/quokka/latest/userguide/workflows-concepts.html
     */
    const workflow: WorkflowDefinition = {
      ...emptyWorkflow,
      Name: 'example-workflow',
    };
    addGenericBranchTrigger(workflow, ['main']);
    addGenericBuildAction({
      workflow,
      blueprint: this,
      actionName: 'execute-cli-commands-build',
      input: {
        // denotes that the input is source code
        Sources: ['WorkflowSource'],
        // input variables to the build action
        Variables: {
          HELLO_MESSAGE: 'hello from a workflow',
        },
      },
      output: {
        AutoDiscoverReports: {
          IncludePaths: ['**/*'],
          ExcludePaths: ['*/.aws/workflows/*'],
          ReportNamePrefix: 'AutoDiscovered',
          Enabled: true,
        },
      },
      // command line executions
      steps: [
        'echo "\${HELLO_MESSAGE}"',
      ],
    });

    new Workflow(this, repo, workflow);
  }
}
`;
};
