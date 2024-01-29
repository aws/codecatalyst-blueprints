```
import { Secret, SecretDefinition } from '@amazon-codecatalyst/blueprint-component.secrets'
```

## Secrets Component

Secrets are used to store sensitive data that can be referenced in workflows. With CodeCatalyst, you can protect these values by adding a secret to
your project, and then referencing the secret in your workflow definition file.

### Example: Creating a secret

```
export interface Options extends ParentOptions {
    ...
    mySecret: SecretDefinition;
}


export class Blueprint extends ParentBlueprint {
  constructor(options_: Options) {
    new Secret(this, options.secret);
}

```

The minimal required default shape looks like:

```
{
    ...
    "secret": {
        "name": "secretName"
    },

}
```

The UI component will prompt the user to enter in a secret value and optional description.

For more info on using Secrets in CodeCatalyst, See
[Working with secrets](https://docs.aws.amazon.com/codecatalyst/latest/userguide/workflows-secrets.html).
