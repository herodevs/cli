import { sortByName } from '@herodevs/utility';
import { Choice, Entry, ReleaseTrain } from './models';

export function getPackageChoices(releaseTrain: ReleaseTrain): Choice<Entry>[] {
  return releaseTrain.entries
    .map((e) => ({
      name: e.packageVersion.origination?.name || e.packageVersion.name,
      value: e,
    }))
    .sort(sortByName);
}
