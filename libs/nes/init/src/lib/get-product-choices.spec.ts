import { getProductChoices } from './get-product-choices';
import { getReleaseTrains } from './get-release-trains';
import { ProjectType } from '@herodevs/core-types';

jest.mock('./get-release-trains');

describe('getProductChoices', () => {
  let getReleaseTrainsMock: jest.Mock;
  beforeEach(() => {
    jest.clearAllMocks();
    getReleaseTrainsMock = getReleaseTrains as jest.Mock;
  });

  it('should return the release trains sorted by name', async () => {
    const accessToken = 'access-token';
    const types: ProjectType[] = ['npm'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockTrains: any[] = [
      {
        name: 'b',
        products: [{ name: 'b' }],
      },
      {
        name: 'a',
        products: [{ name: 'a' }],
      },
    ];

    getReleaseTrainsMock.mockResolvedValue(mockTrains);

    const result = await getProductChoices(accessToken);
    expect(result[0].name).toEqual('a');
    expect(result[1].name).toEqual('b');
  });
});
