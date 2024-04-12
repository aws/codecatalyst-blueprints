type DISPLAY_COMPONENT_TYPE =
    'string' | 'number' | 'checkbox' | 'dropdown' | 'textarea' | 'label'


export type DynamicKVInput = {
  key: string;
  value: string | number;
  label: string;
  /** The type of component to display in the wizard.
    * default: 'string'
    */
  displayComponent?: DISPLAY_COMPONENT_TYPE;

  /**
   * Possible accepted values for dropdown type.
   */
  possibleValues?: string[];
  /**
    * Whether the field is optional.
     * default: false
     */
  optional?: boolean;
  /**
    * Text description to display beneath input.
    */
  description?: string;
  /**
   * Validation regex for 'string'
   */
  validationRegex?: string;
  /**
   * Constraint text to display below string input.
   */
  validationMessage?: string;
  /**
   * Placeholder text to display in empty string or number.
   */
  placeholderText?: string;

  /**
   * Will generate n numbers and append to the value in the wizard.
   */
  defaultEntropy?: number;

  /**
   * If true, will hide field from wizard.
   */
  hidden?: boolean;

  /**
   *
   * If true, field will be collapsed by default in wizard.
   */
  collapsed?: boolean;
};