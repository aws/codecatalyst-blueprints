import * as fs from 'fs';
import { SubstitionAsset } from './static-assets';

jest.mock('fs');

describe('SourceRepository', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('substitutes file contents when given object', () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('{{test}}');

    const asset = new SubstitionAsset('foo');
    const substiution = asset.substitute({
      test: 'foo',
    });

    expect(substiution).toEqual('foo');
  });

  it('substitutes file contents when given object with array', () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('{{#test}}{{key}}{{/test}}');

    const asset = new SubstitionAsset('foo');
    const substiution = asset.substitute({
      test: [{ key: 1 }, { key: 2 }],
    });

    expect(substiution).toEqual('12');
  });
});
