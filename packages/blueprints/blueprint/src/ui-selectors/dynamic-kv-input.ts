export type DISPLAY_COMPONENT_TYPE =
    'string' | 'number' | 'checkbox' | 'dropdown' | 'textarea' | 'label'


export type DynamicKVInput = {
  key: string;
  value: string | number | boolean | null;
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
};