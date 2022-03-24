# Introduction

The frontend wizard on quokka.codes is populated by the Options interface exported from the blueprint. The frontend wizard supports modifications and
features of a blueprint's Options using [JSDOC style comments and tags](https://jsdoc.app/about-getting-started.html). The JSDOC style comments and
tags allow you to do things such as selecting the text displayed above an option and enable featues like input validation or making the option
collapsible. Below is an example of using JSDOC comments and tags with a blueprint's options:

```
export interface Options {
  /**
   * What do you want to call your new blueprint?
   * @validationRegex /^[a-zA-Z0-9_]+$/
   * @validationMessage Must contain only upper and lowercase letters, numbers and underscores
   */
  blueprintName: string;

  /**
   * Add a description for your new blueprint.
   */
   description?: string;

   /**
    * Tags for your Blueprint:
    * @collapsed true
    */
  tags?: string[];
}
```

The display name each option of the Options interface will appear in [camelCase](https://en.wikipedia.org/wiki/Camel_case) format by default. Plain
text in the JSDOC style comment will be displayed as text above the option in the wizard.

# Supported Tags

Here are the following JSDOC tags that a blueprint's Options will support in the frontend wizard.

## @validationRegex _Regex Expression_

- **Requires**: option to be a string
- **Usage**: performs input validation on the option using the given regex expression and display @validationMessage
- **Example**: `@validationRegex /^[a-zA-Z0-9_]+$/`
- **Recommended**: to use with @validationMessage, validation message is empty by default

## @validationMessage _string_

- **Requires**: N/A
- **Usage**: displays validation message on @validation\* failure
- **Example**: `@validationMessage Must contain only upper and lowercase letters, numbers and underscores` requires: @validationRegex/ other errors to
  look into usage:

## @collapsed _boolean (Optional)_

- **Requires**: N/A
- **Usage**: Boolean. Allows a sub option to be collapsible. If the collapsed annotation is present, it is defaulted to true. Setting
  `@collapsed false` creates a collapsable section that is initally open.
- **Example**: `@collapsed true`

## @displayName _string_

- **Requires**: N/A
- **Usage**: Change option display name. Allows formats other than camelCase for the display name.
- **Example**: `@displayName Blueprint Name`
