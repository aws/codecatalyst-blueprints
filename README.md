### Setting up a proper dev environemnt

1. We highly recommend you use VSCODE. This repo is set up to link stuff properly when using VScode.
2. Set up your npm. You'll need access to the proper codeartifact repo.

```
 export NPM_REPO=`aws codeartifact get-repository-endpoint --domain template --domain-owner 721779663932 --repository global-templates --format npm | jq -r '.repositoryEndpoint'`
 echo 'NPM_REPO set to: '$NPM_REPO
 export NPM_REPO_AUTH_TOKEN=`aws codeartifact get-authorization-token --domain template --domain-owner 721779663932 --query authorizationToken --output text`
```

We recommend adding this to your `~/.bash_profile` 3. Disable Projen post.

```
export PROJEN_DISABLE_POST=1
```
