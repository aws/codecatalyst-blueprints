# Subscribe to External Blueprint

This blueprint allows you to subscribe to community blueprint packages on NPM. The generated workflows periodically pull NPM packages and publishes them as custom blueprints in your CodeCatalyst space. A workflow is created for each package you want imported, so the target blueprint that you want published in your space must be made available through NPM. If you publish your own blueprints to NPM, you can use this blueprint to ensure that multiple spaces have the same NPM packages available as custom blueprints. Custom blueprints aren’t available for all tiers. Make sure that your space is subscribed at a tier that supports custom blueprints before using this blueprint. 

For more information, see [Pricing](https://codecatalyst.aws/explore/pricing) and [Changing your CodeCatalyst billing tier](https://docs.aws.amazon.com/codecatalyst/latest/adminguide/managing-billing-change-plan.html).

## Usage

This blueprint creates a workflow for each imported package and works with private NPM repositories. These workflows run once a day to check NPM for new versions of the packages. If a new version exists, the workflow attempts to add it to your CodeCatalyst space as a custom blueprint. The action will fail if a package can’t be found or isn’t a blueprint. The target package must be on NPM, and the package must be a blueprint.

**Important:** If you want to use blueprint packages from external sources, consider the risks that may come with those packages. You're responsible for the custom blueprints that you add to your space and the code they generate.


## Additional resources
* [Working with custom blueprints in CodeCatalyst](https://docs.aws.amazon.com/codecatalyst/latest/userguide/custom-blueprints.html)
* [Working with packages](https://docs.aws.amazon.com/codecatalyst/latest/userguide/workflows-packages.html)
* [About packages and modules](https://docs.npmjs.com/about-packages-and-modules)
* [Open-source GitHub repository](https://github.com/aws/codecatalyst-blueprints)