```
import {...} from '@caws-blueprint-component/caws-environments'
```

The environment component can be found [here](https://github.com/aws/caws-blueprints/tree/main/packages/components/caws-environments).

The blueprint wizard is dynamically generated from the `Options` interface exposed through the [[wizard|https://github.com/aws/caws-blueprints/wiki/Wizard]]. Blueprints supports generating UI components
from exposed types.

### Example 1: Creating development environments

```
export interface Options extends ParentOptions {
    ...
    myNewEnvironment:  EnvironmentDefinition<{
        thisIsMyFirstAccountConnection: AccountConnection<{
            thisIsARole: Role<['lambda', 's3', 'dynamo']>;
        }>;
    }>;
}
```

This allows authors to deploy their applications to the cloud.

The above interface will generate a UI component that asks for a new Environment `myNewEnvironment` with a single account connection `thisIsMyFirstAccountConnection` and a role on that account connection `thisIsARole` with `['lambda', 's3', 'dynamo']` as the minimum required role capabilities. Since not all users will have account connections, it is important to check for the case where a user does not connect an account, and does not connect an account with a role either. This is reflected accurately in the type definition.

Roles can also be annotated with `@inlinePolicies` per [the documentation here](https://github.com/aws/caws-blueprints/wiki/Wizard#inlinepolicy-pathtopolicyfilejson).


The environment component requires a `name` and an `environmentType`. The minimal required default shape looks like this:

```
{
  ...
  "myNewEnvironment": {
    "name": "myProductionEnvironment",
    "environmentType": "PRODUCTION"
  },
}
```

The UI component will then prompt the user for various fields and as they fill in those fields the blueprint will get a fully expanded shape. It is sometimes helpful to include the full 'mock' (see the below examples) in the `defaults.json` for testing and development purposes.

### Example 2: A simple mock interface

```
{
    ...
    "thisIsMyEnvironment": {
        "name": "myProductionEnvironment",
        "environmentType": "PRODUCTION",
        "thisIsMySecondAccountConnection": {
            "id": "12345678910",
            "name": "my-account-connection-name",
            "secondAdminRole": {
                "arn": "arn:aws:iam::12345678910:role/ConnectedQuokkaRole",
                "name": "ConnectedQuokkaRole",
                "capabilities": [
                    "lambda",
                    "s3",
                    "dynamo"
                ]
            }
        }
    }
}
```

### Example 3: A more complicated mock interface

```
export interface Options extends ParentOptions {
  /**
   * The name of an environment
   * @displayName This is a Environment Name
   * @collapsed
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
}
```

### Example 4: A complete mock interface

```
{
  ...
  "thisIsMyEnvironment": {
    "name": "my-production-environment",
    "environmentType": "PRODUCTION",
    "thisIsMySecondAccountConnection": {
      "id": "12345678910",
      "name": "my-connected-account",
      "secondAdminRole": {
        "name": "LambdaQuokkaRole",
        "arn": "arn:aws:iam::12345678910:role/LambdaQuokkaRole",
        "capabilities": [
          "admin",
          "lambda",
          "s3",
          "cloudfront"
        ]
      },
      "secondLambdaRole": {
        "name": "LambdaQuokkaRole",
        "arn": "arn:aws:iam::12345678910:role/LambdaQuokkaRole",
        "capabilities": [
          "lambda",
          "s3"
        ]
      }
    },
    "thisIsMyFirstAccountConnection": {
      "id": "12345678910",
      "name": "my-connected-account",
      "adminRole": {
        "name": "LambdaQuokkaRole",
        "arn": "arn:aws:iam::12345678910:role/LambdaQuokkaRole",
        "capabilities": [
          "admin",
          "lambda",
          "s3",
          "cloudfront"
        ]
      },
      "lambdaRole": {
        "name": "LambdaQuokkaRole",
        "arn": "arn:aws:iam::12345678910:role/LambdaQuokkaRole",
        "capabilities": [
          "lambda",
          "s3"
        ]
      }
    }
  },
}
```