## Supported UI components

The blueprint wizard is dynamically generated from the 'options' interface exposed through the
wizard. Blueprints supports generating UI components from exposed types.

### Environment Component

This components allows authors to create development environments and in order to deploy thir
applications to the cloud.

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

This interface will generate a UI component that asks for a new Environment `myNewEnvironment` with
a single account connection `thisIsMyFirstAccountConnection` and a role on that account connection
`thisIsARole` with `['lambda', 's3', 'dynamo']` as the minimum required role capabilities.

The UI component will then prompt the user
