import { existsSync } from 'fs';
import { ProjectType } from '@herodevs/core-types';
import path = require('path');

export function getProjectTypes(): ProjectType[] {
  const types = [] as ProjectType[];
  if (existsSync(path.join(process.cwd(), 'package.json'))) {
    types.push('npm');
  }
  return types;
}
