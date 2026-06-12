/** Options shared by the local npm proxy implementation. */
export interface InstallProxyOptions {
  authToken: string;
  catalog: InstallCatalogIndex;
  registryAuthToken?: string;
  summary: InstallSummary;
  nesRegistryUrl?: string;
  publicRegistryUrl?: string;
}

/** Catalog entries keyed by the OSS npm package name npm will request. */
export type InstallCatalogIndex = Map<string, InstallCatalogEntry[]>;

/** One installable NES version exposed as an OSS npm version in synthesized metadata. */
export interface InstallCatalogEntry {
  nesPackageName: string;
  nesVersion: string;
  ossVersion: string;
}

/** Aggregates install decisions so the command can report and emit analytics after npm exits. */
export interface InstallSummary {
  availableNotEntitled: Map<string, InstallNesPackageSummary>;
  matchedNesPackages: Map<string, InstallNesPackageSummary>;
  eolNoNesPackages: Map<string, InstallEolPackageSummary>;
}

/** A concrete OSS package/version and the NES package/version selected for it. */
export interface InstallNesPackageSummary {
  ossPackageName: string;
  ossVersion: string;
  nesPackageName: string;
  nesVersion: string;
}

/** Placeholder shape for future EOL opportunities that do not have a NES remediation yet. */
export interface InstallEolPackageSummary {
  packageName: string;
  version?: string;
}

/** Process result from the plain `npm install` child process. */
export interface NpmInstallResult {
  exitCode: number;
}

/** Inputs for the npm child process used by `hd install`. */
export interface NpmInstallOptions {
  authToken: string;
  nesRegistryUrl: string;
  registryAuthToken?: string;
  registryUrl: string;
}
