![Build](https://github.com/aws/codecatalyst-blueprints/actions/workflows/build-action.yml/badge.svg) 

[AWS official Blueprints documentation](https://docs.aws.amazon.com/codecatalyst/latest/userguide/custom-blueprints.html) and
[Wiki](https://github.com/aws/codecatalyst-blueprints/wiki).

This repository contains common blueprint components, the base blueprint contructs and several public blueprints. Codecatalyst blueprints are
available for anyone to develop today. Blueprints are built by a number of teams internally, and this repository only contains the base constructs and
a small number of blueprints maintained by the core blueprints team.

## Blueprints

Blueprints are code generators used to create and maintain projects in [Amazon CodeCatalyst](https://codecatalyst.aws/). You can build your own
blueprint today by upgrading to the CodeCatalyst Enterprise tier.

### Building your own blueprint

Custom blueprints and lifecycle management are generally available to everyone. To build your own blueprint, go to
[codecatalyst.aws](https://codecatalyst.aws/) and make sure your space is upgraded to the Enterprise tier. For more information, see
[Changing your CodeCatalyst billing tier](https://docs.aws.amazon.com/codecatalyst/latest/adminguide/managing-billing-change-plan.html) and
[Getting started with custom blueprints](https://docs.aws.amazon.com/codecatalyst/latest/userguide/getting-started-bp.html).

### Contributions

See our [contribution guidelines](./CONTRIBUTING.md) and our community [Code of Conduct](./CODE_OF_CONDUCT.md) before opening a pull request.
CodeCatalyst blueprints want your feedback and bug reports too! Please add them to our github issues for triage by the service team.

### Learning resources

To learn more about blueprints, see the [wiki](https://github.com/aws/codecatalyst-blueprints/wiki). To learn about using blueprints for your
CodeCatalyst projects or steps to create a custom blueprint, see the
[AWS documentation](https://docs.aws.amazon.com/codecatalyst/latest/userguide/blueprints.html).

In this repository you can find our blueprints SDK, tooling, and several sample blueprints

- Blueprint [base and examples](https://github.com/aws/codecatalyst-blueprints/tree/main/packages/blueprints): `/packages/blueprints/`
  - These are some of the blueprints available to you on CodeCatalyst.
  - [Base blueprint](https://github.com/aws/codecatalyst-blueprints/tree/main/packages/blueprints/blueprint): All blueprints extend this base
    blueprint.
  - [Blueprint builder](https://github.com/aws/codecatalyst-blueprints/tree/main/packages/blueprints/blueprint-builder): A blueprint that generates
    additional blueprints.
  - ...
- Blueprint [component constructs](https://github.com/aws/codecatalyst-blueprints/tree/main/packages/components): `/packages/components/`
  - These are components used to make working with and generating CodeCatalyst resources easier. See the
    [AWS documentation](https://docs.aws.amazon.com/codecatalyst/latest/userguide/develop-publish-bp.html) for detailed API docs on how to use these
    components in your project.
- Blueprint [utility tooling](https://github.com/aws/codecatalyst-blueprints/tree/main/packages/utils): `packages/utils/`
  - This tooling contains the blueprints CLI (used to publish blueprints), as well as basic Projen constructs that define the blueprint and component
    construct codebases.

# Development

This section details how to develop in this repository. We recommend you use [VSCode](https://code.visualstudio.com/). While plugins also exist for
vim, many gitignored files might be invisible in vim and can cause disruptive issues. To get an overview of blueprints and what they are, see the
[Wiki](https://github.com/aws/codecatalyst-blueprints/wiki).

## Install prerequisite node tooling

Blueprints are TypeScript node modules by default (they don't have to be). Install the node tooling globally. These are requirements for various
tooling to work properly and are available from public npm.

```
brew install nvm            # blueprints work with Node 18.x
brew install jq
nvm use
npm install npm@6.14.13 -g  # we suggest using npm 6.14.13, v9.7.2 has performance issues
npm install yarn ts-node webpack webpack-cli -g
```

## Developing codecatalyst-blueprints

Pull down this codebase. We recommend making your own fork. For more information, see the [contribution guidelines](./CONTRIBUTING.md).

```
git clone <my-fork-codecatalyst-blueprints>
```

Run these commands to get started building blueprints. The first time set-up may take a few minutes.

```
cd codecatalyst-blueprints
nvm use
yarn && yarn build
```

After completing the setup, you can make changes to the repository and test them out yourself.

### Test a blueprint in CodeCatalyst

The easiest way to test a blueprint directly in CodeCatalyst is publishing that blueprint into a space you own. Publishing a blueprint allows you to
test a CodeCatalyst blueprint directly in a space. You must be an adminstrator of the target space in order to successfully publish. Your target space
must be part of the Enterprise tier as well.

```
cd packages/blueprints/<blueprint>
yarn blueprint:preview --space my-awesome-space # publishes under a "preview" version tag to 'my-awesome-space'
yarn blueprint:release --space my-awesome-space # publishes normal version to 'my-awesome-space'

yarn blueprint:preview --space my-awesome-space --project my-project # previews blueprint application to an existing project
```

This will publish a private verision of your blueprint into `my-awesome-space`. It will only be available for that space. You may run the command
multiple times to publish to multiple spaces.

### Test a blueprint locally

The fastest way to test a blueprint is to build it locally. You can do this by invoking the following command:

```
cd packages/blueprints/<blueprint>
yarn blueprint:synth (--cache) # cache will emulate how the wizard processes the blueprint
yarn blueprint:resynth (--cache)
```

The `yarn blueprint:synth` command will mock generate a **new** project with a set of options, while `yarn blueprint:resynth` command will mock
generate into an existing project or changing options. Each of these commands result in an output bundle being added into the `./synth/` folder for
each mocked wizard configuration under `wizard-configuration/*.json`. Each of these JSONs represent a partial set of options to be merged on top of
the `defaults.json` when synthesizing.

For a deep dive on blueprint generation, the bundle format, and how to think about lifecycle updates, see the
[Wiki](https://github.com/aws/codecatalyst-blueprints/wiki/Resynthesis).

## Testing Changes to a blueprint component

Blueprints are made up of components found under `./packages/components`. These component constructs represent project components (such as a source
repository).

Modify a component:

```
cd packages/components/<component>
```

Rebuild the component:

```
yarn build
```

To see the changes applied in a blueprint run synth:

```
cd packages/blueprints/<blueprint>
yarn blueprint:synth
```

This generates the blueprint in the `synth` folder:

```
packages/blueprints/<blueprint>/synth/
```

## Snapshot testing

Blueprints support [snapshot testing](https://jestjs.io/docs/snapshot-testing) on configurations provided by blueprint authors. Once snapshot testing
is enabled and configured, the build/test process will synthesize the given configurations and verify that the synthesized outputs haven't changed
from the reference snapshot.

To enable:

1. In `.projenrc.ts`, update the input object to `ProjenBlueprint` with the file(s) you want snapshoted.

```
{
  ....
  blueprintSnapshotConfiguration: {
    snapshotGlobs: ['**', '!environments/**', '!aws-account-to-environment/**'],
  },
}
```

2. Resynthesize the blueprint with `yarn projen`. This will create several TypeScript files in your blueprint project. Don't edit these source files,
   as they're maintained and regenerated by Projen.
3. Find the directory `src/wizard-configurations`, where you'll find the file `default-config.json` with an empty object. Customize or replace this
   file with one or more of your own test configurations. Each test configurations will be merged with the project's `defaults.json`, synthesized, and
   compared to snapshots during `yarn test`.

To run: `yarn test` or `yarn test:update` or any task that includes _test_. The first time you run it, expect to see the following lines:

> Snapshot Summary › NN snapshots written from 1 test suite.

Subsequent test runs will verify that synthesized output hasn't changed from these snapshots and display a line like:

> Snapshots: NN passed, NN total

If you intentionally change your blueprint to emit different output, then run `yarn test:update` to update the reference snapshots.

Snapshots expect synthesized output to be constant from run to run. If your blueprint generates files that vary, you must exclude it from snapshot
testing. Update the `blueprintSnapshotConfiguration` object of your `ProjenBlueprint` input object to add the `snapshotGlobs` property. This property
is an array of [globs](https://github.com/isaacs/node-glob#glob-primer) that determine which files to include and exclude from snapshotting. Note that
there is a _default_ list of globs; if you specify your own list, you may need to explicitly bring back the default entries.
