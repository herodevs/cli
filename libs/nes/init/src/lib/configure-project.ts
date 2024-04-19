import { ProjectType } from '@herodevs/core-types';
import { configureNpmProject } from './npm/configure-npm-project';
import { Entry } from './models';

export function configureProject(
  accessToken: string,
  projectTypes: ProjectType[],
  packages: Entry[]
) {
  if (projectTypes.includes('npm')) {
    configureNpmProject(accessToken, packages);
  }
}
