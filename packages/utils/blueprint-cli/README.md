# Blueprint CLI

This is the blueprints CLI. It is exported as a standard CLI and contains helpful tools for developing blueprints. This is not generally expected to be consumed directly. The blueprint projen construct will generate scripts that rely on various CLI tooling contained here.

```
usage: blueprint [command] [options]

Commands:
  blueprint synth                           locally synthesize the blueprint
                                            with options
  blueprint drive-synth                     Structure call(s) to the synth
                                            command
  blueprint resynth                         locally resynthesize the blueprint,
                                            using the defaults.json any wizard
                                            configs (if they exist)
  blueprint drive-resynth                   locally drive resynthesis across
                                            multiple wizard configs. Defaults to
                                            using the same blueprint and any
                                            existing projects with options under
                                            existing-bundle/. Resynthesis
                                            contructs a new synthesis bundle and
                                            then attempts to merge it with an
                                            exisiting bundle using a common
                                            ancestor.
  blueprint publish <blueprint>             publishes a blueprint
  blueprint build-ast <blueprint>           builds a blueprint ast
  blueprint validate-options <ast>          builds a blueprint ast
  <options>
  blueprint upload-image-public             uploads an image publicly and
  <pathToImage>                             returns its URL. This uses your
                                            current AWS credentials to upload something to an s3 bucket and make it available behind cloudfront.

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
```
  Here is a suggested README for this CLI:

# Blueprint CLI

This CLI provides functionality for working with CodeCatalyst Blueprints.
