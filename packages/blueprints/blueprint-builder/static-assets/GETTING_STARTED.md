# Blueprint development

See blueprints github for full documentation and examples. https://github.com/aws/codecatalyst-blueprints/wiki

## Authoring a blueprint

The blueprint.ts file contains the blueprint code and options interface that will be used to generate the wizard. The blueprint can create source repositories, environments, and workflows based on options the user provides in the wizard.


## Local development

This assumes you have already installed standard node tooling. If not see the section below on standard node tooling.

```
cd ./<my-blueprint-repository>
nvm use
yarn
yarn projen
yarn build
```

Running a (re)synthesis. This will generate (or regenerate) your project from your blueprint locally. Running with `--cache` will first build a cache
and then execute that, this takes slightly longer but emulates the wizard.

```
yarn blueprint:synth (--cache)
yarn blueprint:resynth (--cache)
```

Publish your blueprint into codecatalyst in 'preview' mode. Previewed blueprints are only visible to your space.

```
yarn blueprint:preview
```

## Installing standard Node tooling

This blueprint is a typescript project. You'll need to install standard node tooling globally.

```
#install nvm https://nvm.sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
nvm use
npm install npm@6.14.13 typescript@4.8.2 yarn ts-node webpack webpack-cli -g
brew install jq
```

You will also need access to the blueprint builder in your codecatalyst space. We recommend you develop on mac or a cloud desktop running linux. This
guide assumes you are using a mac and are using `yarn`.

## Projen

Blueprints are projen projects. This allows the blueprints team to propgate lifecycle improvements and it allows users to resynthesize aspects of a
project as they evolve. You'll have to make updates to the `projenrc.ts` as your project evolves. See Projen for further details.
https://github.com/projen/projen

The projenrc.ts represents the model of your codebase. As you update this file you should run `yarn projen` to regenerate this codebase.
