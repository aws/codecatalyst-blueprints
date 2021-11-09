### Development

We highly recommend you use VSCODE. This repo is set up to link stuff properly when using VScode.

We recommend adding this to your `~/.bash_profile`

Set up npm to point to the correct codeartifact repository. You'll need this in order to yarn
install.

```
 export NPM_REPO=`aws codeartifact get-repository-endpoint --domain template --domain-owner 721779663932 --repository blueprints-fake-npm --format npm | jq -r '.repositoryEndpoint'`
 echo 'NPM_REPO set to: '$NPM_REPO
 export NPM_REPO_AUTH_TOKEN=`aws codeartifact get-authorization-token --domain template --domain-owner 721779663932 --query authorizationToken --output text`
```

Disable Projen post. Projen doesnt play very well with workspaces just yet. We need to disable
running projen post action.

```
export PROJEN_DISABLE_POST=1
```
