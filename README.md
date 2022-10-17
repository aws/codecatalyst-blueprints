![Build](https://github.com/aws/caws-blueprints/actions/workflows/build-action.yml/badge.svg)

(Documentation and wiki)[https://github.com/aws/caws-blueprints/wiki].

## Set Up

We highly recommend you use [vscode](https://code.visualstudio.com/). This repo is set up to link things properly when using VScode. Although plugins
also exist for vim. Many gitignored files will be invisible in vim and may cause annoying problems.

#### Prereq:

Install these globally. These are requirements for various tooling to work properly and are available from public npm.

```
#install nvm https://nvm.sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
npm install yarn ts-node webpack webpack-cli -g
brew install jq
```

Add this to your `~/.bash_profile`:

```
set-blueprints-npm-repo() {
  # sign into the aws account that contains the proper codeartifact repository. Ask the blueprints team for access
  ada credentials update --once --account 721779663932 --role codeartifact-readonly --profile=codeartifact-readonly

  # Set NPM config to also be the same repository (needed for some synths to work properly)
  aws codeartifact login --region us-west-2 --tool npm --repository global-templates --domain template --domain-owner 721779663932 --profile=codeartifact-readonly

  #set the repositories in your workspace as an environment variable
  export NPM_REPO=`aws codeartifact get-repository-endpoint --region us-west-2 --domain template --domain-owner 721779663932 --repository global-templates --format npm --profile=codeartifact-readonly | jq -r '.repositoryEndpoint'`
  echo 'NPM_REPO set to: '$NPM_REPO
  export NPM_REPO_AUTH_TOKEN=`aws codeartifact get-authorization-token --region us-west-2 --domain template --domain-owner 721779663932 --query authorizationToken --profile=codeartifact-readonly --output text`
}

# setup the blueprints repo for use
blueprints-setup() {
  nvm use

  # The blueprints repo uses yarn2 which doesn't support projen's --check-post-synthesis flag
  # Disable projen post synthesis
  export PROJEN_DISABLE_POST=1

  # Blueprints are currently published to a private codeartifact repository until the public launch of code.aws.
  # You'll need to ask the blueprints team for access.
  set-blueprints-npm-repo
}
```

## Development

Run these commands to get started building blueprints. The first time set-up may take a minute or two.

```
git clone https://github.com/aws/caws-blueprints
cd caws-blueprints
nvm use
source ~/.bash_profile
blueprints-setup
yarn && yarn build
```

You're done!

Unless you have access to the blueprints organization in quokka, you will not be able to publsih preview versions of these blueprints.

## Testing Changes

Modify a component

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
packages/blueprints/<blueprint>/synth/<timestamp>
```

### Publishing

You must have write access to the 'blueprints' organization in code.aws in order to publish. You'll need to get a `CAWS_COOKIE` and set in in your
environment.

```
// paste it into your terminal like so:
export CAWS_COOKIE='session-blhahBlahblahBlah'
// run from the root
yarn blueprints:release
```

### Clean up

As you test changes to blueprints locally you will build up alot of projects created in the synth directory of the blueprint, to clean up the synth
directory and remove these old projects run:

```
yarn clean-synth
```

Sometimes you may need to reset this project to a clean repository and remove the node modules, dist, lib, and synth directories. To reset this
project to a clean repository run:

```
yarn clean-all
```
