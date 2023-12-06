import { readFileSync, readdirSync } from 'fs';
import * as path from 'path';
import { MergeStrategies } from './merge-strategies';
import { ContextFile } from '../context-file';

const EXAMPLE_ROOT_DIR = 'examples';
const EXAMPLE_DIRS = readdirSync(path.join(__dirname, EXAMPLE_ROOT_DIR));

[MergeStrategies.alwaysUpdate, MergeStrategies.neverUpdate, MergeStrategies.onlyAdd, MergeStrategies.threeWayMerge].forEach(mergeStrategy => {
  describe(`merge strategy: ${mergeStrategy.name}`, () => {
    it.each(EXAMPLE_DIRS)('matches snapshot for example: %s', example => {
      const { a, o, b } = getTestFiles(example);

      const commonAncestorFile: ContextFile = {
        buffer: o,
        path: 'file',
        repositoryName: 'repo',
      };

      const existingFile: ContextFile = {
        buffer: a,
        path: 'file',
        repositoryName: 'repo',
      };

      const proposedFile: ContextFile = {
        buffer: b,
        path: 'file',
        repositoryName: 'repo',
      };

      const resolvedFile = mergeStrategy(commonAncestorFile, existingFile, proposedFile);
      expect(resolvedFile?.buffer?.toString()).toMatchSnapshot();
    });
  });

  if (mergeStrategy === MergeStrategies.threeWayMerge) {
    it('returns the proposed file for binary files', () => {
      const ancestorBuffer = Buffer.from('Ancestor\x00Content');
      const existingBuffer = Buffer.from('Existing\x00Content');
      const proposedBuffer = Buffer.from('Proposed\x00Content');

      const [ancestorFile, existingFile, proposedFile] = [ancestorBuffer, existingBuffer, proposedBuffer].map(buffer => {
        return { buffer, path: 'file', repositoryName: 'repo' };
      });

      const resolvedFile = mergeStrategy(ancestorFile, existingFile, proposedFile);
      expect(resolvedFile?.buffer).toEqual(proposedBuffer);
    });
  }
});

function getTestFiles(dir: string): { a: Buffer; o: Buffer; b: Buffer } {
  const files = readdirSync(path.join(__dirname, EXAMPLE_ROOT_DIR, dir));

  const a = files.find(f => f.startsWith('a.'));
  const b = files.find(f => f.startsWith('b.'));
  const o = files.find(f => f.startsWith('o.'));

  if (!a || !b || !o) {
    throw new Error(`Failed to find test files in directory: ${dir}`);
  }

  return {
    a: readFileSync(path.join(__dirname, EXAMPLE_ROOT_DIR, dir, a)),
    b: readFileSync(path.join(__dirname, EXAMPLE_ROOT_DIR, dir, b)),
    o: readFileSync(path.join(__dirname, EXAMPLE_ROOT_DIR, dir, o)),
  };
}
