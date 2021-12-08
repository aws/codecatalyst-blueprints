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

  return `import { Blueprint as ParentBlueprint, Options as ParentOptions } from '${originPackage}';
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
      const options = Object.assign(defaults, options_);
      console.log(options);

      // example showing copy source files
      // TODO

      // example showing adding workflows
      // blah

      // example showing something else
      // blah
   }
}
`;
};
