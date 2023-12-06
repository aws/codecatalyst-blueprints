```
import {...} from '@amazon-codecatalyst/blueprint-component.source-repositories'
```

# Repository & Source Code Component

A repository is used by codecatalyst to store some code. It takes a name as input. Most components are stored in a repository, such as source code
files, workflows, as well as other components such as MDE workspaces. The source-repository component also exports components used for managing files
and static assets.

```
const repository = new SourceRepository(this, {
  title: 'my-new-repository-title',
});
```

Repositories have naming constraints [see full documentation](https://docs.aws.amazon.com/codecatalyst/latest/userguide/source.html).

## Adding a file

We can write some text file to a repository with the `SourceFile` construct. This operation is one of the most common use cases and takes a
repository, a filepath, and some text contents. If the file path doesn't exist within a repository, this component will create all the needed folders
too!

```
new SourceFile(repository, `path/to/my/file/in/repo/file.txt`, 'my file contents');
```

> Note: all the file constructs are last-write-wins. If you write two files to the same location within the same repository, the last execution will
> overwrite whatever is there. You can use this feature to "layer" generated code, and its especially useful when extending over the code blueprints
> may have generated.

## Adding a generic file

Sometimes we want to write arbitrary bits to our repository. We can read from a buffer and use the `File` construct.

```
new File(repository, `path/to/my/file/in/repo/file.img`, new Buffer(...));

new File(repository, `path/to/my/file/in/repo/new-img.img`, new StaticAsset('path/to/image.png').content());
```

## Copying files

The easiest way to get started with some generated code is to copy-paste some starter code and then generate more code on top of that base. For this
we can place our code inside the `static-assets` directory and then target that code with the `StaticAsset` construct. The pathing in this case will
always start at the root of the `static-assets` directory.

```
const starterCode = new StaticAsset('path/to/file/file.txt')
const starterCodeText = new StaticAsset('path/to/file/file.txt').toString()
const starterCodeRawContent = new StaticAsset('path/to/image/hello.png').content()

const starterCodePath = new StaticAsset('path/to/image/hello.png').path()
// starterCodePath is equal to 'path/to/image/hello.png'
```

A subclass of `StaticAsset` is `SubstitionAsset`. This functions exactly the same way but allows us to run a mustache subsitition over the file
instead.

```
const starterCodeText = new SubstitionAsset('path/to/file/file.txt').subsitite({
  'my_variable': 'subbed value1',
  'another_variable': 'subbed value2'
})
```

This can be really useful for doing copy-and-replace style generation. Note: running subsitite over files that aren't text interpretable is usually
going to produce errors.

## Targetting multiple files

Static Assets support glob targetting through a static function on `StaticAsset` and its subclasses called `findAll(...)`, this will return a list of
static assets preloaded with their paths, contents, and more. We can chain this with `File` constructions to copy-paste everything in the
`static-assets` directory.

```
StaticAsset.findAll().forEach(item => {
  new File(repository, item.path(), item.content());
});
```

or we can target just `.md` files under a specific folder and its subfolders in `static-assets` and substitute the same variables in each file.

```
SubstitionAsset.findAll('my-folder/**/*.md').forEach(item => {
  new SourceFile(repository, item.path(), item.subsitite({
    'my_variable': 'subbed value1',
    'another_variable': 'subbed value2'
  }));
});
```

## Example 1: Creating a new repository

Repository component is used to create a new repository in a generated project:

```
import { SourceRepository } from '@amazon-codecatalyst/blueprint-component.source-repositories';
...
const repository = new SourceRepository(this, { title: 'myRepo' });
```

You can then add files or workflows to the created repository:

## Example 2: Adding file(s) and/or workflow(s) to an existing repository

```
import { SourceFile } from '@amazon-codecatalyst/blueprint-component.source-repositories';
import { Workflow } from '@amazon-codecatalyst/blueprint-component.workflows';
...
new SourceFile(repository, 'README.md', 'This is the content of my readme');
new Workflow(this, repository, {/**...workflowDefinition...**/});
```

Combining the above two pieces of code would generate a single repository named `myRepo` with a source file `README.md` as well as a codecatalyst
workflow at the root.
