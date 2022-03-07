import { SourceRepository, SourceFile } from '@caws-blueprint-component/caws-source-repositories';
import * as path from 'path';

export interface imports {
  import: string;
  from: string;
}

export interface classInstantiations {
  variable: string;
  instantiatedClass: string;
  options: any;
}

export interface postInstantiation {
  line: string;
}

export interface Options {
  subfolder?: string;
}

export class ProjenRCFile extends SourceFile {
  imports: imports[] = [];
  instantiations: classInstantiations[] = [];
  postInstantiations: postInstantiation[] = [];

  constructor(
    repository: SourceRepository,
    options?: Options,
  ) {
    super(repository, path.join(options?.subfolder || '', '.projenrc.ts'), '', {
      readonly: false
    });
    repository.blueprint._addComponent(this);
  }

  addImport(import_: imports) {
    this.imports.push(import_);
  }

  addInstantiation(instantiation: classInstantiations) {
    this.instantiations.push(instantiation);
  }

  addPostInstantiation(postInstantiation: postInstantiation) {
    this.postInstantiations.push(postInstantiation);
  }

  override synthesize(): void {
    super.synthesize();
    const condencedImports = {} as {
      [key: string]: Set<string>;
    } ;
    this.imports.forEach(import_ => {
      if(!condencedImports[import_.from]) {
        condencedImports[import_.from] = new Set();
      }
      condencedImports[import_.from].add(import_.import);
    })

    const imports = Object.keys(condencedImports).map(
      from => `import { ${[...condencedImports[from]].join(',')} } from '${from}';`
    );
    const instantiations = this.instantiations.map(instantiation => `const ${instantiation.variable} = new ${instantiation.instantiatedClass}(${JSON.stringify(instantiation.options, null, 2)});`);
    const postInstantiations = this.postInstantiations.map(postInstantiation => postInstantiation.line);

    imports.forEach(line => this.addLine(line));
    this.addLine('');
    instantiations.forEach(line => this.addLine(line));
    this.addLine('');
    postInstantiations.forEach(line => this.addLine(line));
    this.addLine('');
    this.instantiations.forEach(instantiation => this.addLine(`${instantiation.variable}.synth();`));
  }
}
