# Subscribe to Blueprint

This blueprint allows you to subscribe to community blueprint packages distributed on NPM. It creates workflows that periodically import public NPM
packages as new private blueprints in your space. This requires that the target blueprint be avaiable through NPM.

## Usage

This blueprint generates workflows that run once a day. Each day the workflow checks NPM for a new version of your package and if it exists, the
workflow attempts to add it to your space as a private blueprint. This action will fail if the package cannot be found or is not a blueprint.

- Runs once daily

- Import multiple blueprints at a time

- Works with private NPM repositories

Using this blueprint requires that your space be upgraded to the enterprise tier, the target package is on NPM, and that the package is a blueprint.
