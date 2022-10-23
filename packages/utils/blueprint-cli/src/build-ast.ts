import * as fs from 'fs';
import * as path from 'path';
import * as pino from 'pino';
import * as yargs from 'yargs';
import { parse } from './ast/parser/parse';
import { walk } from './ast/parser/walk';
import { getAstJSON } from './ast/transformer';

export interface AstOptions extends yargs.Arguments {
  blueprint: string;
  outdir: string;
}

export async function buildAst(log: pino.BaseLogger, blueprint: string, outdir: string): Promise<void> {
  log.debug('Creating AST from: ' + blueprint);
  const blueprintPath = path.resolve(blueprint);
  const outdirPath = path.resolve(outdir);

  let blueprintsource = '';
  let ast = '';
  try {
    blueprintsource = fs.readFileSync(blueprintPath, 'utf8');
    ast = await getAstJSON(blueprintsource);
    if (!fs.existsSync(outdirPath)) {
      fs.mkdirSync(outdirPath);
    }
  } catch (e) {
    log.error('Cannot find blueprint at: %s', blueprintPath);
    process.exit(255);
  }

  // walk the ast, look for @inlinePolicy and json replace with the pointed file contents if its there.
  const INLINE_POLICY_ANNOTATION = 'inlinePolicy';
  const astObject = parse(ast);
  for (const node of walk(astObject[0])) {
    const inlinePolicy = node?.jsDoc?.tags![`${INLINE_POLICY_ANNOTATION}`];
    if (inlinePolicy) {
      log.info(`found inline policy on ${node.name} ${node.kind} ${node.type}`);
      log.debug(`[inline policy] attempting to resolve inline policy at ${inlinePolicy}`);
      const blueprintSourceRelativePath = './src/';
      const inlinePolicyAbsolutePath = path.resolve(blueprint, '../..', blueprintSourceRelativePath, inlinePolicy);

      let onelinePolicy;
      try {
        onelinePolicy = JSON.stringify(JSON.parse(fs.readFileSync(inlinePolicyAbsolutePath, 'utf8')));
      } catch (error) {
        log.error('[inline policy] Cannot read or parse policy at: %s', inlinePolicyAbsolutePath);
        process.exit(255);
      }

      log.debug(`[inline policy] attempting to replace '${inlinePolicy}' in ast`);
      ast = ast.replace(`"comment":"${inlinePolicy}"`, `"comment":${JSON.stringify(onelinePolicy)}`);
    }
  }

  try {
    log.debug(`Writing ast.json to ${outdirPath}`);
    fs.writeFileSync(path.join(outdirPath, 'ast.json'), ast);
  } catch (error) {
    log.error('Cannot write blueprint ast to: %s', outdirPath);
    process.exit(255);
  }
}
