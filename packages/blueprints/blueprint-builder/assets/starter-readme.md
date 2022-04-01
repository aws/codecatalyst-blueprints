## Welcome to blueprint development

Blueprints and their components are usually published to public NPM. For now, since code.aws is still in early beta access we publish blueprints and
components to a private codeartifact repository. Contact the blueprints team for access.

Blueprints are projen projects. This allows the blueprints team to propgate lifecycle improvements and it allows users to resynthesize aspects of a
project as they evolve. You'll have to make updates to the `projenrc.ts` as your project evolves.

```
yarn projen
```

### Public Blueprints

The blueprints team maintains a [to-be open-sourced repository](https://github.com/aws/caws-blueprints/blob/main/README.md) with common components and
public blueprints. You'll need to be part of the AWS organization on github to see this codebase.

We recommend adding this to your `~/.bash_profile`. Account `721779663932` owns the code-artifact repository. Contact the blueprints team for access.

```
 # SWITCH INTO THE PROPER AWS ACCOUNT
 # <get 721779663932 account creds>

 # Set NPM to be the temporary code artifact repository (needed for local developement to work properly)
 aws codeartifact login --region us-west-2 --tool npm --repository global-templates --domain template --domain-owner 721779663932

 # Disable Projen post. Not critical, but projen can be annoying sometimes
 export PROJEN_DISABLE_POST=1
```

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

You must have write access to the 'blueprints' organization in code.aws in order to publish. You'll need to get a `CAWS_COOKIE` and set in in your
environment.

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
