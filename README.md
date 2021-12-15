## Set Up

We highly recommend you use [vscode](https://code.visualstudio.com/). This repo is set up to link
things properly when using VScode. Although plugins also exist for vimlords.

We recommend adding this to your `~/.bash_profile`

Set up npm to point to the correct codeartifact repository. You'll need this in order to yarn
install.

```
# set project config
 export NPM_REPO=`aws codeartifact get-repository-endpoint --domain template --domain-owner 721779663932 --repository global-templates --format npm | jq -r '.repositoryEndpoint'`
 echo 'NPM_REPO set to: '$NPM_REPO
 export NPM_REPO_AUTH_TOKEN=`aws codeartifact get-authorization-token --domain template --domain-owner 721779663932 --query authorizationToken --output text`

 # Set NPM config to also be the same repository (needed for some synths to work properly)
 aws codeartifact login --tool npm --repository global-templates --domain template --domain-owner 721779663932
```

Disable Projen post. Projen doesnt play very well with workspaces just yet. We need to disable
running projen post action.

```
export PROJEN_DISABLE_POST=1
```

## Development

git clone

```
git clone https://github.com/aws/caws-blueprints
```

Run yarn. This will link everything. The first time workspace setup may take a minute or two.

```
cd caws-blueprints
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