import { filterStrategies } from './deserialize-strategies';
import { MergeStrategies } from './merge-strategies';
import { Strategy } from './models';

describe('filterStrategies', () => {
  it('filters strategies with non-matching owners', () => {
    const baseStrategy: Strategy = {
      identifier: 'my_strategy',
      strategy: MergeStrategies.alwaysUpdate,
      globs: ['*'],
    };

    const matchingStrategies = [
      '*',
      '@caws-blueprints/*',
      '@caws-blueprints/test-blueprint',
      '@caws-blueprints/test-blueprint@1.2.3',
      '@caws-blueprints/test-blueprint@1.*.*',
      '*/test-blueprint',
      '*/*@1.*',
    ].map(owner => {
      return {
        ...baseStrategy,
        owner,
      };
    });

    const nonmatchingStrategies = [
      '@another-namespace/test-blueprint',
      '@another-namespace/*',
      '@caws-blueprints/test-blueprint@2.0.0',
      '*/wrong-name',
    ].map(owner => {
      return {
        ...baseStrategy,
        owner,
      };
    });

    const filtered = filterStrategies(
      {
        'src/repo/.blueprint-ownership': [...matchingStrategies, ...nonmatchingStrategies],
      },
      {
        name: '@caws-blueprints/test-blueprint',
        version: '1.2.3',
      },
    );

    expect(filtered).toStrictEqual({
      'src/repo/.blueprint-ownership': matchingStrategies,
    });
  });
});
