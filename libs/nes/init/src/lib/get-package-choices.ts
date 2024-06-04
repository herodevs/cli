import { sortByName } from '@herodevs/utility';
import { Choice, Entry, ReleaseTrain } from './models';

export function getPackageChoices(releaseTrain: ReleaseTrain): Choice<Entry>[] {
  return releaseTrain.entries
    .map((e) => {
      let name = e.packageVersion.name;
      if (e.packageVersion.origination) {
        name = e.packageVersion.origination.name;
      }
      return {
        name: name,
        value: e,
      };
    })
    .sort(sortByName);
}
