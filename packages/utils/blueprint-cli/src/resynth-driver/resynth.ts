import * as pino from 'pino';
import yargs from 'yargs';
import { synthesize, SynthOptions } from '../synth-driver/synth';

export interface ResynthesizeCliOptions extends yargs.Arguments {
  blueprint: string;
  outdir: string;
  cache: boolean;

  options: string;
  /**
   * path to additional configurations that are merged on top of the defaults
   */
  additionalOptionOverrides?: string;
}

/**
 * executes a resynthesis
 * @param log
 * @param options
 */
export async function resynthesize(log: pino.BaseLogger, options: SynthOptions): Promise<void> {
  return synthesize(log, options);
}
