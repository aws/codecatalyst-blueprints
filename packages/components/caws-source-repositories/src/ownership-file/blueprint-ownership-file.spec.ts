import * as fs from 'fs';
import path from 'path';
import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { MergeStrategies } from '../lifecycle/merge-strategy';
import { Strategy } from '../lifecycle/models';
import { BlueprintOwnershipFile } from './blueprint-ownership-file';

// correspond with ownership files in the examples directory
const VALID_TEST_CASES: { name: string; strategies: Strategy[] }[] = [
  {
    name: 'blueprint.ownership',
    strategies: [
      {
        identifier: 'never_update',
        globs: ['*'],
        strategy: MergeStrategies.neverUpdate,
      },
    ],
  },
  {
    name: 'multiple-strategies-blueprint.ownership',
    strategies: [
      {
        identifier: 'never_update',
        globs: ['*', '*.ts'],
        strategy: MergeStrategies.neverUpdate,
      },
      {
        identifier: 'always_update',
        globs: ['*.java'],
        strategy: MergeStrategies.neverUpdate, // TODO: update once strategies are correctly resolved
      },
    ],
  },
];

const INVALID_EXAMPLE_FILES = fs.readdirSync(path.join(__dirname, 'examples', 'invalid'));

describe('BlueprintOwnershipFile', () => {
  const mockBlueprint = {
    context: {
      package: {
        name: '@caws-blueprint/blueprint',
      },
    },
  } as Blueprint;

  test.each(VALID_TEST_CASES)('successfully serializes test case: $name', testCase => {
    const expectedContents = getExampleFile(testCase.name);

    expect(
      BlueprintOwnershipFile.asString(mockBlueprint, {
        resynthesis: {
          strategies: testCase.strategies,
        },
      }),
    ).toEqual(expectedContents);
  });

  test.each(VALID_TEST_CASES)('successfully deserializes test case: $name', testCase => {
    const contents = getExampleFile(testCase.name);

    expect(BlueprintOwnershipFile.asDefinition(contents)).toMatchObject({
      resynthesis: {
        strategies: testCase.strategies,
      },
    });
  });

  test.each(INVALID_EXAMPLE_FILES)('throws an error when deserializing: %s', exampleFileName => {
    expect(() => {
      BlueprintOwnershipFile.asDefinition(getExampleFile(exampleFileName, true));
    }).toThrow();
  });

  test('throws an error when serializing when no owner is provided', () => {
    const mockBlueprintWithMissingPackageName = {
      context: {
        package: {},
      },
    } as Blueprint;

    expect(() => {
      BlueprintOwnershipFile.asString(mockBlueprintWithMissingPackageName, {
        resynthesis: {
          strategies: [
            {
              identifier: 'always_update',
              strategy: MergeStrategies.alwaysUpdate,
              globs: ['*'],
            },
          ],
        },
      });
    }).toThrow();
  });
});

function getExampleFile(fileName: string, invalid?: boolean): string {
  const pathElements = [__dirname, 'examples'];
  if (invalid) {
    pathElements.push('invalid');
  }

  return fs.readFileSync(path.join(...pathElements, fileName)).toString();
}
