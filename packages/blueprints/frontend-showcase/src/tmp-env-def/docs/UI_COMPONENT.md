## Supported UI components

The blueprint wizard is dynamically generated from the 'options' interface exposed through the wizard. Blueprints supports generating UI components
from exposed types.

### Environment Component

This components allows authors to create development environments and in order to deploy thir applications to the cloud.

example:

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

This interface will generate a UI component that asks for a new Environment `myNewEnvironment` with a single account connection
`thisIsMyFirstAccountConnection` and a role on that account connection `thisIsARole` with `['lambda', 's3', 'dynamo']` as the minimum required role
capabilities. Since not all users will have account connections, it is important to check for the case where a user does not connect an account, and
does not connect an account with a role either. This is reflected accurately in the type definition.

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

The UI component will then prompt the user for various fields and as they fill in those fields the blueprint will get a fully expanded shape. See
below for an example. It is sometimes helpful to include this full 'mock' in the `defaults.json` for testing and development purposes.

```
{
    ...
    "thisIsMyEnvironment": {
        "name": "myProductionEnvironment",
        "environmentType": "PRODUCTION",
        "thisIsMySecondAccountConnection": {
            "accountId": "12345678910",
            "accountName": "my-account-connection-name",
            "secondAdminRole": {
                "arn": "arn:aws:iam::12345678910:role/ConnectedQuokkaRole",
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

This is another, more complicated example:

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

And the full shape:

```
{
  ...
  "thisIsMyEnvironment": {
    "name": "my-production-environment",
    "environmentType": "PRODUCTION",
    "thisIsMySecondAccountConnection": {
      "accountId": "12345678910",
      "accountName": "my-connected-account",
      "secondAdminRole": {
        "arn": "arn:aws:iam::12345678910:role/LambdaQuokkaRole",
        "capabilities": [
          "admin",
          "lambda",
          "s3",
          "cloudfront"
        ]
      },
      "secondLambdaRole": {
        "arn": "arn:aws:iam::12345678910:role/LambdaQuokkaRole",
        "capabilities": [
          "lambda",
          "s3"
        ]
      }
    },
    "thisIsMyFirstAccountConnection": {
      "accountId": "12345678910",
      "accountName": "my-connected-account",
      "adminRole": {
        "arn": "arn:aws:iam::12345678910:role/LambdaQuokkaRole",
        "capabilities": [
          "admin",
          "lambda",
          "s3",
          "cloudfront"
        ]
      },
      "lambdaRole": {
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
