# Developing custom blueprints

You can develop a custom blueprint to deploy source repositories, workflows, environments, and other resources to CodeCatalyst projects.

A blueprint takes user input options, combines the input options with the blueprint's logic to output a project bundle, which CodeCatalyst uses to
make (or modify) resources for a project.

Blueprints can generate code in any language and create almost any CodeCatalyst resource. They often generate common files, configurations, and
workflows for a project type. Blueprints can, for example, set up a web application project that contains a CDK stack and CodeCatalyst workflows that
auto-deploys into an AWS account.

You can modify the the Blueprint class and Options interface in `src/blueprint.ts` to customize your blueprint code and wizard options. For more
information, see [Working with custom blueprints in CodeCatalyst](https://docs.aws.amazon.com/codecatalyst/latest/userguide/custom-blueprints.html).

## Testing your blueprint locally

Custom blueprints provide preview bundles as a result of a successful synthesis. The project bundle represents the source code, configuration, and
resources deployed in a project. You can synthesize your blueprint to emulate project creation without having to create a project in CodeCatalyst. To
synthesize your blueprint, use the following command:

```
yarn blueprint:synth
```

The synthesis output is generated in the `synth/synth.[options-name]/proposed-bundle/` folder. For more information, see
[Synthesis](https://docs.aws.amazon.com/codecatalyst/latest/userguide/custom-bp-concepts.html#synthesis-concept).

If you're updating your custom blueprint, run the following command to resynthesize your blueprint:

```
yarn blueprint:resynth
```

For more information, see [Resynthesis](https://docs.aws.amazon.com/codecatalyst/latest/userguide/custom-bp-concepts.html#resynthesis-concept).

## Previewing and publishing a blueprint

After configuring your custom blueprint locally, you can build and preview your blueprint before publishing it to your space.

#### To view and publish a preview custom blueprint version

Manually publish a preview version of your blueprint to your space using commands from your package.json file.

1. Install necessary dependencies using the following command:

```
yarn install
```

2. (Optional) Projen is an open-source tool that custom blueprints use to keep themselves updated and consistent. Blueprints come as Projen packages
   because this framework provides you with the ability to build, bundle, and publish projects, and you can use the interface to manage a project's
   configurations and settings. If you made changes to the `.projenrc.ts` file, regenerate the configuration of your project before building and
   previewing your blueprint. Use the following command:

```
yarn projen
```

3. Rebuild and preview your custom blueprint using the following command:

```
yarn blueprint:preview
```

To preview your custom blueprint in CodeCatalyst, navigate to the `See this blueprint at:` link provided in the preview command output. Check that the
wizard UI, including text, appears as you expected based on your configuration. If you want to make further changes to your custom blueprint, you can
edit the blueprint code, resynthesize the blueprint, and then run the preview command again.

## Adding a blueprint to a space’s blueprint catalog

Publish a release version of your blueprint using the following command:

```
yarn blueprint:release
```

To add the blueprint to your space catalog, navigate to the `Enable version version at:` link in the release command output. For more information, see
[Adding a custom blueprint to a space catalog](https://docs.aws.amazon.com/codecatalyst/latest/userguide/add-remove-bp.html).

After developing and previewing your custom blueprint, you can publish and add your blueprint to the space’s blueprints catalog. For more information,
see [Viewing a custom blueprint](https://docs.aws.amazon.com/codecatalyst/latest/userguide/view-bp.html), and
[Adding a custom blueprint to a space](https://docs.aws.amazon.com/codecatalyst/latest/userguide/add-remove-bp.html).
