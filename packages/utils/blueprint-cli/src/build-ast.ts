import * as fs from 'fs';
import * as path from 'path';
import * as pino from 'pino';
import * as yargs from 'yargs';
import { Node } from './ast/parser/node';
import { parse } from './ast/parser/parse';
import { walk } from './ast/parser/walk';
import { getAstJSON } from './ast/transformer';

export interface AstOptions extends yargs.Arguments {
  blueprint: string;
  outdir: string;
}

const supportInlineJson = (log: pino.BaseLogger, annotation: string, node: Node, blueprintPath: string): string => {
  log.info(`[${annotation}] found ${annotation} on ${node.path} ${node.kind} ${node.type}`);
  const jsonLocation = node?.jsDoc?.tags![`${annotation}`];

  log.info(`[${annotation}] attempting to resolve ${annotation} from ${jsonLocation}`);
  const blueprintSourceRelativePath = './src/';
  const inlinePolicyAbsolutePath = path.resolve(blueprintPath, '../..', blueprintSourceRelativePath, jsonLocation!);

  let onelineJson;
  try {
    onelineJson = JSON.stringify(JSON.parse(fs.readFileSync(inlinePolicyAbsolutePath, 'utf8')));
  } catch (error) {
    log.error(`[${annotation}] Cannot read or parse policy at: %s`, inlinePolicyAbsolutePath);
    process.exit(255);
  }
  return onelineJson;
};

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
  const TRUSTPOLICY_POLICY_ANNOTATION = 'trustPolicy';
  const astObject = parse(ast);

  for (const node of walk(astObject[0])) {
    const inlinePolicyFile = node?.jsDoc?.tags![`${INLINE_POLICY_ANNOTATION}`];
    if (inlinePolicyFile) {
      const policy = supportInlineJson(log, INLINE_POLICY_ANNOTATION, node, blueprint);
      ast = ast.replace(`"comment":"${inlinePolicyFile}"`, `"comment":${JSON.stringify(policy)}`);
    }

    const trustPolicyFile = node?.jsDoc?.tags![`${TRUSTPOLICY_POLICY_ANNOTATION}`];
    if (trustPolicyFile) {
      const policy = supportInlineJson(log, TRUSTPOLICY_POLICY_ANNOTATION, node, blueprint);
      ast = ast.replace(`"comment":"${trustPolicyFile}"`, `"comment":${JSON.stringify(policy)}`);
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
