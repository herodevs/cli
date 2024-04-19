import { ProjectType } from '@herodevs/core-types';
import { getProjectTypes } from '@herodevs/utility';

export function verifyProjectType(): {
  types: ProjectType[];
  valid: boolean;
  error?: string;
} {
  const types = getProjectTypes();
  let valid = true;
  let error: string | undefined = undefined;
  if (types.length === 0) {
    valid = false;
    error = 'Project type not recognized.';
  }

  return {
    types: types,
    valid,
    error,
  };
}
