import { ProjectType } from '@herodevs/core-types';
import { sortByName } from '@herodevs/utility';
import { Choice, ReleaseTrain } from './models';
import { getReleaseTrains } from './get-release-trains';

export async function getProductChoices(
  accessToken: string,
  types: ProjectType[]
): Promise<Choice<ReleaseTrain[]>[]> {
  const releaseTrains = await getReleaseTrains(accessToken);

  const products = releaseTrains.reduce((acc, rt) => {
    rt.products.forEach((product) => {
      if (acc[product.name]) {
        acc[product.name].push(rt);
      } else {
        acc[product.name] = [rt];
      }
    });

    return acc;
  }, {} as { [key: string]: ReleaseTrain[] });

  return Object.entries(products)
    .map(([key, value]) => ({
      name: key,
      value,
    }))
    .sort(sortByName);
}
