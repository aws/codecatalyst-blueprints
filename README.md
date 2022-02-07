## Set Up

We highly recommend you use [vscode](https://code.visualstudio.com/). This repo is set up to link
things properly when using VScode. Although plugins also exist for vimlords.

#### Prereq:
Install these globally. This is required for various tooling to work properly
```
npm install ts-node -g
npm install webpack-cli -g
npm install nvm -g
npm install yarn -g
brew install jq
```


We recommend adding this to your `~/.bash_profile`

```
blueprints-setup() {
    # sign into the aws account that contains the proper codeartifact repository. Ask the blueprints team for access
    ada credentials update --once --account 721779663932 --role codeartifact-readonly

    # Set NPM config to also be the same repository (needed for some synths to work properly)
    aws codeartifact login --region us-west-2 --tool npm --repository global-templates --domain template --domain-owner 721779663932

    #set the repositories in your workspace
    export NPM_REPO=`aws codeartifact get-repository-endpoint --region us-west-2 --domain template --domain-owner 721779663932 --repository global-templates --format npm | jq -r '.repositoryEndpoint'`
    echo 'NPM_REPO set to: '$NPM_REPO
    export NPM_REPO_AUTH_TOKEN=`aws codeartifact get-authorization-token --region us-west-2 --domain template --domain-owner 721779663932 --query authorizationToken --output text` 

    #disable projen post synthesis
    export PROJEN_DISABLE_POST=1
}
```


## Development

git clone

```
git clone https://github.com/aws/caws-blueprints
```

Run yarn. This will link everything. The first time workspace setup may take a minute or two.

```
cd caws-blueprints
nvm use
source ~/.bash_profile
blueprints-setup
yarn
```

Run a build

```
yarn build
```

You're done!

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

You must have write access to the 'blueprints' organization in code.aws in order to publish. You'll need to get a `CAWS_COOKIE` and set in in your environment.

```
// paste it into your terminal like so:
export CAWS_COOKIE='session-blhahBlahblahBlah'
// run from the root
yarn blueprints:publish
```
