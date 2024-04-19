export interface PackageVersion {
  id?: number;
  name: string;
  version?: string;
  fqns: string;
  origination?: {
    name: string;
    type: string;
    version: string;
  };
  release?: {
    semverVersion: string;
  };
}
