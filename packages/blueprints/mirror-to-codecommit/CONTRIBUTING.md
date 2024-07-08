# CONTRIBUTING

## Test Changes

Verify:

```bash
yarn build
```

To test with a project without releasing:

```bash
yarn blueprint:preview --project $projectName --space $spaceName
```

## Release Changes

The blueprint will be automatically published with a new version when merged into `main` from the workflow. The first time you release the blueprint,
you will need to add it to your Space's Blueprint catalog.

To manually release the blueprint:

_When this is merged into main, it will automatically bump the version in package.json_

```
yarn blueprint:release
# Follow the URL to bump the catalog version in the console
```

After this succeeds, go to the project's blueprint console and resynthesize the blueprint.
