import yargs from 'yargs';

export interface OpenOptions extends yargs.Arguments {
  space: string;
  project: string;
}
