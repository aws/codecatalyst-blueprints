## Blueprint development

Blueprints and their components are usually published to public NPM. For now, since code.aws is still in early beta access we publish blueprints and
components to a private codeartifact repository. Contact the blueprints team for access.

Blueprints are projen projects. This allows the blueprints team to propgate lifecycle improvements and it allows users to resynthesize aspects of a
project as they evolve. You'll have to make updates to the `projenrc.ts` as your project evolves.

## Set Up

We highly recommend you use [vscode](https://code.visualstudio.com/). This repo is set up to link things properly when using VScode. Many gitignored
files will be invisible in vim and may cause problems. We recommend you develop on mac or a cloud desktop running linux. This guide assumes you are
using a mac and are using `yarn`, the same commands work with `npm`.

### Make sure you have

The blueprints team should have given you:

- Access to account `721779663932` and role `codeartifact-readonly`.
- Publishing access. If you can see the blueprint builder you probably have publishing access.
- Information on how to get and set the proper `CAWS_COOKIE` for authentication.

### Prereq:

Install these globally. They are a requirement for various tooling to work properly and are available from public npm.

```
#install nvm https://nvm.sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
npm install yarn ts-node webpack webpack-cli -g
brew install jq
```

Add this to your `~/.bash_profile`.

```
set-blueprints-npm-repo() {
  # sign into the aws account that contains the proper codeartifact repository. Ask the blueprints team for access
  ada credentials update --once --account 721779663932 --role codeartifact-readonly --profile=codeartifact-readonly

  # Set NPM config to also be the same repository (needed for some synths to work properly)
  aws codeartifact login --region us-west-2 --tool npm --repository global-templates --domain template --domain-owner 721779663932 --profile=codeartifact-readonly

  npm config set always-auth true
}

# setup the blueprints repo for use
blueprints-setup() {
  # Disable projen post synthesis
  export PROJEN_DISABLE_POST=1

  # Blueprints are currently published to a private codeartifact repository until the public launch of code.aws.
  # You'll need to ask the blueprints team for access.
  set-blueprints-npm-repo
}
```

### Public Blueprints

The blueprints team maintains a [to-be open-sourced repository](https://github.com/aws/caws-blueprints/blob/main/README.md) with common components and
public blueprints. You'll need to be part of the AWS organization on github to see this codebase.

## Development

git clone

```
git clone <my-blueprints>
```

Run yarn. This will link everything. The first time workspace setup may take a minute or two.

> Set projen to version `0.52.18` in the generated package.json. Projen pushes breaking updates periodically, the blueprints team is working through
> them.

```
cd /<blueprint>
blueprints-setup
yarn
yarn projen
```

Run a build

```
yarn build
```

You're done!

## Testing Changes

To see the changes applied in a blueprint run synth

```
cd /<blueprint>
yarn blueprint:synth
```

This generates the blueprint in the `synth` folder

```
packages/blueprints/<blueprint>/synth/<timestamp>
```

#### Synth with cache

For stability and performance, blueprints run synth from a cache from the last successfully published synth. You can test synthesis using a cache with
this command:

```
yarn build
yarn blueprint:synth:cache
```

### Publishing

You must have write access to publish in code.aws in order to publish your blueprint. Ask the blueprints team for access. You'll also need to set a
`CAWS_COOKIE` and set in in your environment. Ask the blueprints team.

```
// paste it into your terminal like so:
export CAWS_COOKIE='session-blhahBlahblahBlah'
// run from the root

// this publishes a preview version of the blueprint designed development.
yarn blueprint:preview

// this publishes a release version of the blueprint designed for wide consumption.
yarn blueprint:release
```

By default the blueprint will only show up in your organization. Contact the blueprint organization to flag your blueprints as public access.
