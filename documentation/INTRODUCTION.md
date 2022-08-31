## Introduction

Blueprints generate code.aws projects. They are constructs that take some user input and use that to synthesize a project. This repository contains
blueprints and blueprint components that are published by the code.aws team, anyone will eventually be able to create and publish their own blueprints by using the
blueprint-builder.

Documentation is contained in this folder! Please make updates directly here.

## What are Blueprints?

Blueprint projects are projects that generate other projects. They do this by combining user input with author written code to write out the contents
of a project during a `synthesis` step. Normally this done by the wizard as part of creating a new code.aws project. However, authors can test this
process locally in any blueprint by running:

```
yarn blueprint:synth
```

Authors will see the blueprint execute itself by calling the main blueprint.ts class with whatever is in the `defaults.json`. It’ll generate a new project
bundle under the synth/ folder. Whatever ends up here is the project that a blueprint generates. This is exactly what the wizard does when it
generates a new project too! Except the wizard will overwrite some sections of the defaults.json with user input (if it's entered).

## What can be generated with a Blueprint?

Blueprints can ask users for a variety of inputs and generate almost any code.aws resource. Blueprints can ask users for many different types of
input, like aws account connections and can generate most code.aws resources such as environments, source code, issues, etc. They are fully capable of
generating code in any language too. By combining these components, blueprints can - for example - set up a web application project that contains a
CDK stack and code.aws workflows that auto-deploy it into a customer aws account.

## Development Flow

Typically blueprint authors have a specific type of project in mind they’d like their blueprint to generate. The typical development flow is
progressively making updates to the `blueprint.ts` class, running `yarn blueprint:synth` to see the output under `synth/` and then doing that again as
the output gets closer to they project they have in mind. Eventually, authors might want to test their blueprint fully end-to-end in the wizard too.
This can be done by publishing a `preview` version by running.

```
yarn blueprint:preview
```

In the process of development authors should use components to help them build blueprints quickly. Consult the documentation for a full API spec,
these components can be found in this codebase. For example, the repository component will create a new repository in a generated project.

```
import { SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
...
const repository = new SourceRepository(this, { title: 'myRepo' });
```

Things like workflows or source files live in a repository. Here’s an example of adding a file and a workflow to your repo.

```
import { SourceFile } from '@caws-blueprint-component/caws-source-repositories';
import { Workflow } from '@caws-blueprint-component/caws-workflows';
...
new SourceFile(repository, 'README.md', 'This is the contents of my readme');
new Workflow(this, repository, {/**...workflowDefinition...**/});
```

This code would generate a single repository 'myRepo' with a sourceFile 'README.md' at the root and a code.aws workflow too.

## Asking for user input

Many times authors will want to ask users for some input. The Wizard is smart enough to dynamically generate itself from the blueprint's `options`
interface found at the top of the `blueprint.ts`. For example, adding a string field to this interface will prompt the user for a text input field.
Adding a enum field will create a radio selection. See Supported Tags for more information. Just remember to add a corresponding entry in the
`defaults.json`.

Authors can (and should!) use this user input to change how and what code they generate.

## What is a project bundle?

Blueprints write out “project bundles” as the result of a successful synthesis. A "bundle" is really just folders to help code.aws determine which resources go where. For example,
under ‘src/’ you might find stuff that gets deployed as source code or under ‘environments’ you might find yaml representations of environments.
Authors generally don’t have to know this format if they are using blueprint components - each component will write to the proper place in the bundle.
Under the hood, the bundle is used by the code.aws deployment system to create and seed various code.aws resources from the blueprint.

## Why Projen?

Projen is an open-source tool that blueprints use to keep themselves updated and all “looking the same”, this tool allows us to keep blueprints
updated at scale, even after they’ve been created. Projen is owns the configuration for a project and for the most part, it shouldn't impact most
authors day-to-day. Occassionally, authors will need to run `yarn projen` to regenerate the configuration of their project, when they add dependencies
or otherwise change options in the `projenrc.ts`. Projen is also the underlying generation tool blueprints to synthesize projects.
[See projen](https://github.com/projen/projen).
