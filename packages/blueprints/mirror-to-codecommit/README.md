# About this blueprint

This blueprint provides a workflow to automatically sync your Amazon CodeCatalyst source repositories to CodeCommit. To use this, add the blueprint to
your project and specify which branch to sync.

This workflows assumes that codecatalyst is the source of truth. Whenever a commit is pushed to codecatalyst main, it will be force pushed to
codecommit main.

## Mirroring

This blueprint is helpful to customer looking to replicate code from codecatalyst to codecommit for various purposes.
