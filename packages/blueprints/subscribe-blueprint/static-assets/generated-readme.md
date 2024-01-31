# Subscribe to External Blueprint

This project has been created from the 'Subscribe to External' Blueprint. It contains workflows that periodically pull NPM packages and publish them
as custom blueprints in this CodeCatalyst space.

## Usage

This blueprint creates a workflow for each imported package. These workflows run once a day to check NPM for new versions of the packages. If a new
version exists, the workflow attempts to add it to your CodeCatalyst space as a custom blueprint. The action will fail if a package can’t be found or
isn’t a blueprint. The target package must be on NPM, and the package must be a blueprint. The space must also be part of the enterprise tier.

### Important

If you want to use blueprint packages from external sources, consider the risks that may come with those packages. You're responsible for the custom
blueprints that you add to your space and the code they generate.
