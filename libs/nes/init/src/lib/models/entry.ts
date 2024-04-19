import { PackageVersion } from './package-version';

export interface Entry {
  ordinal?: number;
  accessible?: boolean;
  packageVersion: PackageVersion;
}
