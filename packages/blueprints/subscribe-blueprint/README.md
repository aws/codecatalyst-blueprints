# Subscribe to External Blueprint

This blueprint allows you to subscribe to community blueprint packages on NPM. The generated workflows periodically pull NPM packages and publishes
them as custom blueprints in your CodeCatalyst space. A workflow is created for each package you want to import, so the target blueprint that you want
published in your space must be made available through NPM. If you publish your own blueprints to NPM, you can use this blueprint to help ensure that
multiple spaces have the same NPM packages available as a custom blueprints. Custom blueprints are not available for all tiers. Make sure that your
space is subscribed at a tier that supports custom blueprints before using this blueprint. For more information, see Pricing and Changing your
CodeCatalyst billing tier.

## Usage

This blueprint creates a workflow for each imported package. These workflows run once a day to check NPM for new versions of the packages. If a new
version exists, the workflow attempts to add it to your CodeCatalyst space as a custom blueprint. The action will fail if a package can’t be found or
isn’t a blueprint. The target package must be on NPM, and the package must be a blueprint. The space must also be part of the enterprise tier.

### Important

If you want to use blueprint packages from external sources, consider the risks that may come with those packages. You're responsible for the custom
blueprints that you add to your space and the code they generate.
