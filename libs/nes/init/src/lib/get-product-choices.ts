import { ProjectType } from '@herodevs/core-types';
import { sortByName } from '@herodevs/utility';
import { Choice, ReleaseTrain } from './models';
import { getReleaseTrains } from './get-release-trains';

export async function getProductChoices(
  accessToken: string,
  types: ProjectType[]
): Promise<Choice<ReleaseTrain>[]> {
  const releaseTrains = await getReleaseTrains(accessToken, types);

  return releaseTrains
    .map((rt) => ({
      name: rt.name,
      value: rt,
    }))
    .sort(sortByName);
}
