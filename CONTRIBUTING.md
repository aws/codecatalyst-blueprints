## Contributions

In order to keep the development experience uniform between developers who may not have access to open branches, fork this repository and work on that fork.

Use git remotes to manage your different versions.

```
git remote add origin <<link_to_your_fork>>
git remote add upstream <<link_to_this_repo>>
```

Make your changes and commit them as normal. Local testing instructions are in the README.

```
yarn blueprint:synth
yarn blueprint:preview --publisher <<my-space>>
```

When you push to origin, GitHub automatically open a PR into the upstream repository.

```
git fetch upstream && git rebase upstream/main
git push origin main
```

## Opening PRs

We ask that you submit PRs with clean commits adhering to [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) spec. This helps everyone else understand the changes and quickly see what is going on. Additionally, semantic commits allow us to be smart about generating changelogs. If your PRis large, break up your changes by commit to make reviewing easier. Commits should follow the following format:

```
<<action>>(<<scope>>): <<what happened>>
feat(blueprint-builder): added great new functionality
```

Example:

```
chore(web-app): reworded the readme to generate clearer guidelines
fix(utils): utils generate without a bug that caused a race condition
feat(import-from-git): added the 'awesome' field
```

Since PRs get squashed by default, it's important to set the PR titles in the same way. Make sure to fill out the description fields when opening a PR.
