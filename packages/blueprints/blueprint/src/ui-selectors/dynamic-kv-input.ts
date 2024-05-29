
/**
 * string: generates a string input in the wizard. Must specify validationRegex used to validate user input
 *
 * number: generates a number input in the wizard.
 *
 * checkbox: generates a checkbox in the wizard.
 *
 * dropdown: generates a radio input for 3 or fewer options, or a dropdown for 4 or more options. Must specify possibleValues.
 *
 * textarea: generates a text area input.
 *
 * label: generates a header text label in the wizard.
 *
 * region: generates a region dropdown.
 *
 * Example possibleValues for region :
 * ['us-west-2', 'us-east-1']: Allows user to choose US West (Oregon) or US East (N. Virginia)
 * ['*']: Allows user to choose any AWS region

*/
export type DISPLAY_COMPONENT_TYPE =
    'string' | 'number' | 'checkbox' | 'dropdown' | 'textarea' | 'label' | 'region' | 'environment'


export type DynamicKVInput = {
  key: string;
  value: string | number | boolean | string[] | any | null;
  /** The type of component to display in the wizard.
    * default: 'string'
    */
  displayType?: DISPLAY_COMPONENT_TYPE | string;

  /**
   * Possible accepted values for dropdown type.
   */
  possibleValues?: string[];
  /**
     * If true, field is optional.
     * default: false
     */
  optional?: boolean;

  /**
   * Allows users to choose more than one option in a dropdown. Can only use with dropdown or region displayTypes.
   */
  multiselect?: boolean;

  /**
    * Display name for field in wizard. If not specified, key will be used.
    */
  displayName?: string;
  /**
    * Text description displayed in wizard.
    */
  description?: string;
  /**
   * Validation regex for 'string'
   */
  validationRegex?: string;
  /**
   * If input in wizard does not satisfy validationRegex, this message is displayed under the field.
   */
  validationMessage?: string;
  /**
   * Placeholder text to display in empty input.
   */
  placeholderText?: string;

  /**
   * If specified, wizard will append n numbers to the value in the wizard.
   */
  defaultEntropy?: number;

  /**
   * If true, field is hidden in the wizard.
   */
  hidden?: boolean;

  /**
   *
   * If true, field will be collapsed by default in wizard.
   */
  collapsed?: boolean;

  /**
   * Options for 'environment' display type
  */
  environmentOptions: {
  /**
 * Configure account connections for 'environment' display type
 */
    accountConnections?: AccountConnectionInput[];
    /**
   * if true, display environment name input in wizard
   */
    showName?: boolean;

    /**
   * if true, environment name in wizard will be read only
   */
    readOnlyName?: boolean;
    /**
   * if true, show environment type chooser dropdown in wizard
   */
    showEnvironmentType?: boolean;
  };


};

type AccountConnectionInput = {
  name: string;
  description?: string;
  roles?: RoleInput[];
};

type RoleInput = {
  name: string;
  displayName?: string;
  /**
   * Display required role capabilites in wizard
   */
  capabilities: string[];
  /**
   * Display required  trust policy
   */
  trustPolicy?: string;
  /**
   * Display required trust policy
   */
  inlinePolicy?: string;
};