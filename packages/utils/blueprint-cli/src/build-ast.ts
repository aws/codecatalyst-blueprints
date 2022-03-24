import * as fs from 'fs';
import * as path from 'path';
import * as pino from 'pino';
import * as yargs from 'yargs';
import { getAstJSON } from './ast/transformer';

export interface AstOptions extends yargs.Arguments {
  blueprint: string;
  outdir: string;
}

export async function buildAst(log: pino.BaseLogger, blueprint: string, outdir: string): Promise<void> {
  log.debug('Creating AST from: ' + blueprint);
  const blueprintPath = path.resolve(blueprint);
  const outdirPath = path.resolve(outdir);

  try {
    const blueprintsource = fs.readFileSync(blueprintPath, 'utf8');
    const ast = await getAstJSON(blueprintsource);
    if (!fs.existsSync(outdirPath)) {
      fs.mkdirSync(outdirPath);
    }
    log.debug(`Writing ast.json to ${outdirPath}`);
    fs.writeFileSync(path.join(outdirPath, 'ast.json'), ast);
  } catch (e) {
    log.error('Cannot find blueprint at: %s', blueprintPath);
    process.exit(255);
  }
}
