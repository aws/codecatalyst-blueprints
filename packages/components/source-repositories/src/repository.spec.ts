import { Blueprint } from '@amazon-codecatalyst/blueprints.blueprint';
import { SourceFile } from './files/source-file';
import { SourceRepository } from './repository';
import { SubstitionAsset } from './static-assets';

jest.mock('./files/source-file');

jest.mock('./static-assets', () => ({
  SubstitionAsset: {
    findAll: jest.fn().mockImplementation(() => {
      return [];
    }),
  },
}));

const mockSubstitutionAsset = jest.mocked(SubstitionAsset);
const mockSourceFile = jest.mocked(SourceFile);

const mockBlueprint = {
  context: {
    rootDir: '.',
  },
  _addComponent: jest.fn(),
} as unknown as Blueprint;

describe('SourceRepository', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('copyStaticFiles', () => {
    it('preserves file names', () => {
      const testAssets = ['.dotfile', 'test.ts', 'test-file', 'src/.dotfile', 'src/test.ts', 'src/test-file'];
      mockStaticAssets(...testAssets);

      const repo = new SourceRepository(mockBlueprint, {
        title: 'test-repo',
      });

      repo.copyStaticFiles();

      testAssets.forEach(path => {
        expect(mockSourceFile).toHaveBeenCalledWith(repo, path, TEST_FILE_CONTENTS);
      });
    });

    it('copies static files from a directory to a different directory', () => {
      const testAssets = ['src/.dotfile', 'src/test.ts', 'src/test-file'];
      mockStaticAssets(...testAssets);

      const repo = new SourceRepository(mockBlueprint, {
        title: 'test-repo',
      });

      repo.copyStaticFiles({
        from: 'src',
        to: 'dest',
      });

      testAssets.forEach(path => {
        expect(mockSourceFile).toHaveBeenCalledWith(repo, path.replace('src/', 'dest/'), TEST_FILE_CONTENTS);
      });
    });

    it('substitutes file contents', () => {
      const testAssets = ['src/.dotfile', 'src/test.ts', 'src/test-file'];
      mockStaticAssets(...testAssets);

      const repo = new SourceRepository(mockBlueprint, {
        title: 'test-repo',
      });

      repo.copyStaticFiles({
        substitute: {
          test_var: 'test_val',
        },
      });

      testAssets.forEach(path => {
        expect(mockSourceFile).toHaveBeenCalledWith(repo, path, TEST_SUBSTITUTED_CONTENTS);
      });
    });
  });
});

const TEST_FILE_CONTENTS = 'test file contents';
const TEST_SUBSTITUTED_CONTENTS = 'test substituted contents';

function mockStaticAssets(...paths: string[]): void {
  mockSubstitutionAsset.findAll.mockImplementationOnce(() => {
    return paths.map(path => {
      return {
        path: jest.fn().mockReturnValue(path),
        content: jest.fn().mockReturnValue(TEST_FILE_CONTENTS),
        toString: jest.fn().mockReturnValue(TEST_FILE_CONTENTS),
        substitute: jest.fn().mockReturnValue(TEST_SUBSTITUTED_CONTENTS),
      } as unknown as SubstitionAsset;
    });
  });
}
