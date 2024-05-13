import * as fs from 'fs';
import * as path from 'path';
import { Component } from 'projen';
import { DynamicKVInput } from './dynamic-kv-input';
import { Blueprint } from '../blueprint';

/**
 * This represents an options schema based on DynamicKVInput types
 */
export type KVSchema = DynamicKVInput[];

/**
 * This represents all wizard supported schemas.
 */
export type OptionsSchemaType = KVSchema;

/**
 * This represents a section of the wizard that can be dynamically rendered from a schema provided by the synthesis process.
 */
export type OptionsSchemaDefinition<
  // @ts-ignore:next-line value is never read
  Identifier extends string,
  // @ts-ignore:next-line value is never read
  SchemaType extends OptionsSchemaType,
  ReturnType extends any = any,
> = ReturnType | undefined;

/**
 * This component can be used to define a schema with a given identifier.
 */
export class OptionsSchema<T extends OptionsSchemaType> extends Component {
  constructor(protected readonly blueprint: Blueprint, protected readonly identifier: string, protected readonly schema: T) {
    super(blueprint);
  }

  synthesize(): void {
    if (!fs.existsSync(this.blueprint.context.wizardOptionsPath)) {
      fs.mkdirSync(this.blueprint.context.wizardOptionsPath);
    }

    fs.writeFileSync(path.join(this.blueprint.context.wizardOptionsPath, this.identifier), JSON.stringify(this.schema));
  }
}
