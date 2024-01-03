## Developing blueprints

You can develop your custom blueprint to meet specific requirements, and test the blueprint by creating a project when previewing. You can develop the custom blueprint to deploy resources to a project using blueprint components, such as specific source code, account connections, workflows, and issues. For more information, see [Working with custom blueprints in CodeCatalyst](https://docs.aws.amazon.com/codecatalyst/latest/userguide/custom-blueprints.html).


The `blueprint.ts` file contains the blueprint code and options interface that will be used to generate the wizard. The blueprint can create source repositories, environments, and workflows based on options the user provides in the wizard.


## Previewing and publishing a blueprint

After configuring your custom blueprint locally, you can build and preview your blueprint before publishing it to your space. 

### To view and publish a preview custom blueprint version

Manually publish a preview version of your blueprint to your space using commands from your package.json file.

1. Install necessary dependencies for your project using the following command:

```
yarn
```
2. (Optional) Projen is an open-source tool that custom blueprints use to keep themselves updated and consistent. Blueprints come as Projen packages because this framework provides you with the ability to build, bundle, and publish projects, and you can use the interface to manage a project's configurations and settings. If you made changes to the `.projenrc.ts` file, regenerate the configuration of your project before building and previewing your blueprint. Use the following command:

```
yarn projen
```

3. Rebuild and preview your custom blueprint using the following command:

```
yarn bluerpint:preview
```

Navigate to the `See this blueprint at:` link provided to preview your custom blueprint. Check that the UI, including text, appears as you expected based on your configuration. If you want to change your custom blueprint, you can edit the, resynthesize the blueprint, and then preview the version again.

(Optional) You can publish a preview version of your custom blueprint, which can then be added to your space's blueprint catalog. Navigate to the `Enable version preview version at:` link to publish a preview version to your space.

Custom blueprints provide preview bundles as a result of a successful synthesis. The project bundle represents the source code, configuration, and resources in a project, and it's used by CodeCatalyst deployment API operations to deploy into a project. You can emulate project creation without having to create a project in CodeCatalyst. To synthesize your project, use the following command:

```
yarn blueprint:synth
```

A blueprint is generated in the `synth/synth.[options-name]/proposed-bundle/` folder. For more information, see [Synthesis](https://docs.aws.amazon.com/codecatalyst/latest/userguide/custom-bp-concepts.html#synthesis-concept).

If you're updating your custom blueprint, instead, run the following command to resynthesize your project:

```
yarn blueprint:resynth
```

A blueprint is generated in the `synth/synth.[options-name]/proposed-bundle/` folder. For more information, see [Resynthesis](https://docs.aws.amazon.com/codecatalyst/latest/userguide/custom-bp-concepts.html#resynthesis-concept).

## Adding a blueprint to a space’s blueprint catalog

After developing and previewing your custom blueprint, you can publish and add your blueprint to the space’s blueprints catalog. For more information, see [Viewing a custom blueprint](https://docs.aws.amazon.com/codecatalyst/latest/userguide/view-bp.html), and [Adding a custom blueprint to a space](https://docs.aws.amazon.com/codecatalyst/latest/userguide/add-remove-bp.html).

