import { getPackageChoices } from './get-package-choices';
import { mockTrains } from './mock-trains';

describe('getPackageChoices', () => {
  it('should get the package choices for a release train', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = getPackageChoices(mockTrains[0]);
    expect(result).toHaveLength(mockTrains[0].entries.length);
  });

  it('should map the packageVersion.origination.name to the name', () => {
    const mockName = 'mock-name';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const releaseTrain = {
      entries: [
        {
          packageVersion: { origination: { name: mockName } },
        },
      ],
    } as any;
    const result = getPackageChoices(releaseTrain);
    expect(result[0].name).toEqual(mockName);
  });

  it('should map the packageVersion.name to the name when packageVersion.origination.name is not set', () => {
    const mockName = 'mock-name';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const releaseTrain = {
      entries: [
        {
          packageVersion: { name: mockName },
        },
      ],
    } as any;
    const result = getPackageChoices(releaseTrain);
    expect(result[0].name).toEqual(mockName);
  });

  it('should handle a release train with no entries', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = getPackageChoices({ entries: [] } as any);
    expect(result).toEqual([]);
  });
});
