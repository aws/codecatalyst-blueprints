export function generateGettingStarted() {
  return `
  # Blueprint development 
  See blueprints github for full documentation and examples. https://github.com/aws/caws-blueprints/wiki
  
  ## Local Development
  This assumes you have already done the first time set up.
  \`\`\`
  cd ./<my-blueprint-repository>
  blueprints-setup
  yarn 
  yarn projen
  yarn build
  yarn synth --cache 
  \`\`\`
  
  Running a (re)synthesis. This will generate your project from your blueprint locally. Running with \`--cache\` will first build a cache and then execute that, this takes slightly longer but emulates the wizard.
  \`\`\`
  yarn blueprint:synth
  yarn blueprint:synth --cache
  \`\`\`
  \`\`\`
  yarn blueprint:resynth
  yarn blueprint:resynth --cache
  \`\`\`
  Publish your blueprint into codecatalyst in 'preview' mode. Previewed blueprints are only visible to your space. This requires a CAWS_COOKIE which can be copy-pasted from any graphql call in the network tab in chrome.
  \`\`\`
  export CAWS_COOKIE='<<insert caws cookie>>'
  yarn blueprint:preview
  \`\`\`
  
  # First time set up
  
  We recommend you use [vscode](https://code.visualstudio.com/). This repo is set up to link things properly when using VScode. Many gitignored
  files will be invisible in vim and may cause problems. We recommend you develop on mac or a cloud desktop running linux. This guide assumes you are
  using a mac and are using \`yarn\`.
  
  ## Install standard Node tooling
  
  This blueprints is a typescript project. You'll need to install standard node tooling globally. This is available from public NPM.
  
  \`\`\`
  #install nvm https://nvm.sh
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
  nvm use
  npm install npm@6.14.13 typescript@4.8.2 yarn ts-node webpack webpack-cli -g
  brew install jq
  \`\`\`
  You will also need access to the blueprint builder in your codecatalyst space.
  
  ## Authenticate to npm repository
  For now, since codecatalyst blueprints are not yet open-sourced, the base blueprint and blueprint components are published in a private codeartifact repository. The blueprints team can give you access. See #help-codecatalyst-blueprints on slack.
  
  - You must have access to account \`721779663932\` and role \`codeartifact-readonly\` through isengard for this command to work.
  
  Recommended: Add this to your \`~/.bash_profile\`.
  
  \`\`\`
  set-blueprints-npm-repo() {
    # sign into the aws account that contains the proper codeartifact repository. Ask the blueprints team for access
    ada credentials update --once --account 721779663932 --role codeartifact-readonly --profile=codeartifact-readonly
  
    # Set NPM config to also be the same repository (needed for some synths to work properly)
    aws codeartifact login --region us-west-2 --tool npm --repository global-templates --domain template --domain-owner 721779663932 --profile=codeartifact-readonly
  
    #set the repositories in your workspace as an environment variable
    export NPM_REPO=\`aws codeartifact get-repository-endpoint --region us-west-2 --domain template --domain-owner 721779663932 --repository global-templates --format npm --profile=codeartifact-readonly | jq -r '.repositoryEndpoint'\`
    echo 'NPM_REPO set to: '$NPM_REPO
    export NPM_REPO_AUTH_TOKEN=\`aws codeartifact get-authorization-token --region us-west-2 --domain template --domain-owner 721779663932 --query authorizationToken --profile=codeartifact-readonly --output text\`
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
  \`\`\`
  
  ## Projen
  
  Blueprints are projen projects. This allows the blueprints team to propgate lifecycle improvements and it allows users to resynthesize aspects of a
  project as they evolve. You'll have to make updates to the \`projenrc.ts\` as your project evolves. See Projen for further details. https://github.com/projen/projen
  
  The projenrc.ts represents the model of your codebase. As you update this file you should run \`yarn projen\` to regenerate this codebase.
  
  `;
}
