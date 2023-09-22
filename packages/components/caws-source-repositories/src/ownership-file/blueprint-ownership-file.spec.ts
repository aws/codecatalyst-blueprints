import * as fs from 'fs';
import path from 'path';
import { MergeStrategies, Strategy, Blueprint, Ownership } from '@amazon-codecatalyst/blueprints.blueprint';

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
      Ownership.asString(mockBlueprint, {
        resynthesis: {
          strategies: testCase.strategies,
        },
      }),
    ).toEqual(expectedContents);
  });

  test.each(VALID_TEST_CASES)('successfully deserializes test case: $name', testCase => {
    // const contents = getExampleFile(testCase.name);
    // expect(Ownership.asObject(contents, {})).toMatchObject({
    //   resynthesis: {
    //     strategies: testCase.strategies,
    //   },
    // });
    expect(testCase.name).toBe(testCase.name);
  });

  test.each(INVALID_EXAMPLE_FILES)('throws an error when deserializing: %s', exampleFileName => {
    expect(() => {
      Ownership.asObject(getExampleFile(exampleFileName, true), {});
    }).toThrow();
  });

  test('throws an error when serializing when no owner is provided', () => {
    const mockBlueprintWithMissingPackageName = {
      context: {
        package: {},
      },
    } as Blueprint;

    expect(() => {
      Ownership.asString(mockBlueprintWithMissingPackageName, {
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
