![Build](https://github.com/aws/codecatalyst-blueprints/actions/workflows/build-action.yml/badge.svg)

[AWS official documentation](https://docs.aws.amazon.com/codecatalyst/latest/userguide/custom-blueprints.html) and
[wiki](https://github.com/aws/codecatalyst-blueprints/wiki)

This guide deals with how to develop in this codebase.

## Blueprints

The codecatalyst blueprints team maintains a [open-sourced repository](https://github.com/aws/amazon-codecatalyst/blob/main/README.md). This
repository contains common blueprint components, the base blueprint contruct and several public blueprints. Codecatalyst blueprints are available for
anyone to develop today! Blueprints are built by a number of teams internally, this repository only contains the base constructs and a small number of
blueprints.

### Building your own blueprint

Custom blueprints and lifecycle management are generally available to everyone. To build your own blueprint please go to
[codecatalyst.aws](https://codecatalyst.aws/) and make sure your space is upgraded to the enterprise tier. You are able to build your own blueprint by
using the "create blueprint" button under your space settings > blueprints tab.

### We love Contributions!

Please take a look at our [contribution guidelines](./CONTRIBUTING.md) and our community [Code of Conduct](./CODE_OF_CONDUCT.md) before opening a pull
request. CodeCatalyst blueprints want your feedback and bug reports too! Please add them to our github issues for triage by the service team.

### Learning resources

Please take a look at our [wiki](https://github.com/aws/codecatalyst-blueprints/wiki) to learn more about blueprints. You may also find
[public documentation](https://docs.aws.amazon.com/codecatalyst/latest/userguide/blueprints.html) helpful.

In this repository you can find our blueprints SDK, tooling, and several sample blueprints

- Blueprint [Base and examples](https://github.com/aws/codecatalyst-blueprints/tree/main/packages/blueprints): `/packages/blueprints/`
  - These are some of the blueprints available to everyone on codecatalyst.
  - [Base blueprint](https://github.com/aws/codecatalyst-blueprints/tree/main/packages/blueprints/blueprint): All blueprints extend this base
    blueprint.
  - [Blueprint Builder](https://github.com/aws/codecatalyst-blueprints/tree/main/packages/blueprints/blueprint-builder): Is a blueprint which
    generates additional blueprints
  - ...
- Blueprint [component constructs](https://github.com/aws/codecatalyst-blueprints/tree/main/packages/components): `/packages/components/`
  - These are components used to make working with and generating codecatalyst resources easier. Please consult
    [public documentation](https://docs.aws.amazon.com/codecatalyst/latest/userguide/develop-publish-bp.html) for detailed API docs on how to use
    these components in your project.
- Blueprint [Utility Tooling](https://github.com/aws/codecatalyst-blueprints/tree/main/packages/utils): `packages/utils/`
  - This tooling contains the blueprints CLI (used to publish blueprints) as well as basic projen constructs which define the blueprint and component
    construct codebases

# Development

This section details how to develop in this repository. We recommend you use [vscode](https://code.visualstudio.com/). Although plugins also exist for
vim. Many gitignored files might be invisible in vim and may cause annoying problems. For an overview of blueprints and what they are, please check
out our wiki.

## Install prerequisite node tooling

Blueprints are typescript node modules by default (although they dont have to be!). Install this node tooling globally. These are requirements for
various tooling to work properly and are available from public npm.

```
brew install nvm            # blueprints work with Node 18.x
brew install jq
nvm use
npm install npm@6.14.13 -g  # we suggest using npm 6.14.13, v9.7.2 has perf issues
npm install yarn ts-node webpack webpack-cli -g
```

## Developing codecatalyst-blueprints

Pull down this codebase. We recommend making your own fork. See [contribution guidelines](./CONTRIBUTING.md).

```
git clone <my-fork-codecatalyst-blueprints>
```

Run these commands to get started building blueprints. The first time set-up may take a minute or two.

```
cd codecatalyst-blueprints
nvm use
yarn && yarn build
```

You're done with set up! Now you can go ahead and make changes to repo and test them out yourself.

### Test a blueprint in CodeCatalyst

The easiest way to test a blueprint directly in codecatalyst is publishing that blueprint into a space you own. Publishing a blueprint will allow you
to test a codecatalyst blueprint directly in a space. You must be an admin of the target space in order for publishing to succeed. Your target space
must be part of the enterprise tier as well.

```
cd packages/blueprints/<blueprint>
yarn blueprint:preview --publisher my-awesome-space # publishes under a "preview" version tag
yarn blueprint:release --publisher my-awesome-space # publishes normal version
```

This will publish a private verision of your blueprint into `my-awesome-space`. It will only be available for that space. You may run this command
multiple times to publish to multiple spaces.

### Test a blueprint locally

The fastest way to test a blueprint is to build it locally. You can do this by invoking this command.

```
cd packages/blueprints/<blueprint>
yarn blueprint:synth (--cache) # cache will emulate how the wizard processes the blueprint
yarn blueprint:resynth (--cache)
```

The `yarn blueprint:synth` command will mock generating a **new** project with a set of options, while `yarn blueprint:resynth` command will mock
generating into an existing project or changing options. Each of these commands result in an output bundle being added into the `./synth/` folder for
each mocked wizard configuration under `wizard-configuration/*.json`. Each of these JSONs represent a partial set of options to be merged on top of
the `defaults.json` when synthesizing.

For a deep dive on blueprint generation, the bundle format, and how to think about lifecycle updates please take a look at our
[wiki page here](https://github.com/aws/codecatalyst-blueprints/wiki/Resynthesis).

## Testing Changes to a blueprint component

Blueprints are made up of components found under `./packages/components`. These component constructs represent project components (such as a source
repository). Modify a component

```
cd packages/components/<component>
```

Rebuild the component

```
yarn build
```

To see the changes applied in a blueprint run synth

```
cd packages/blueprints/<blueprint>
yarn blueprint:synth
```

This generates the blueprint in the `synth` folder

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

2. Resynthesize the blueprint with `yarn projen`. This will create several TypeScript files in your blueprint project. Do not edit these source files,
   as they're maintained and regenerated by Projen.
3. Find the directory `src/wizard-configurations`, where you'll find the file `default-config.json` with an empty object. Customize or replace this
   file with one or more of your own test configurations. Each test configurations will be merged with the project's `defaults.json`, synthesized, and
   compared to snapshots during `yarn test`.

To run: run `yarn test` or `yarn test:update` or any task that includes _test_. The first time you run it, expect to see the lines:

> Snapshot Summary › NN snapshots written from 1 test suite.

Subsequent test runs will verify that synthesized output hasn't changed from these snapshots and display a line like:

> Snapshots: NN passed, NN total

If you intentionally change your blueprint to emit different output, then run `yarn test:update` to update the reference snapshots.

Snapshots expect synthesized output to be constant from run to run. If your blueprint generates files that vary, you must exclude it from snapshot
testing. Update the `blueprintSnapshotConfiguration` object of your `ProjenBlueprint` input object to add the `snapshotGlobs` property. This property
is an array of [globs](https://github.com/isaacs/node-glob#glob-primer) that determine which files to include and exclude from snapshotting. Note that
there is a _default_ list of globs; if you specify your own list, you may need to explicitly bring back the default entries.
