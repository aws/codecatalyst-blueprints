## Contributions

In order to keep the development experience uniform between developers who may not have access to open branches, Please fork this repo and work on
that fork.

Please use git remotes to manaage your different versions.

```
git remote add origin <<link_to_your_fork>>
git remote add upstream <<link_to_this_repo>>
```

Make your changes and commit them as normal. Local testing instructions are in the README

```
yarn blueprint:synth
yarn blueprint:preview --publisher <<my-space>>
```

When you push to origin, github is smart enough to automatically open a PR into the upstream repo.

```
git fetch upstream && git rebase upstream/main
git push origin main
```

## Opening PRs

We ask that your submit PRs with clean commits adhering to [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) spec. This helps
everyone else understand and quickly see what is going on. Additionally, semantic commits allow us to be smart about generating changelogs. If your PR
is large, please break up your changes by commit to make reviewing easier. Commits should follow the following format:

```
<<action>>(<<scope>>): <<what happened>>
feat(blueprint-builder): added great new functionality
```

example:

```
chore(web-app): reworded the readme to generate clearer guidelines
fix(utils): utils generate without a bug that caused a race condition
feat(import-from-git): added the 'awesome' field
```

Since PRs get squashed by default, its important to set the PR's title in the same way! Please make sure to fill out the description fields when
opening a PR.
