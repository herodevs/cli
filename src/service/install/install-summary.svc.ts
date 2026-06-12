import semver from 'semver';
import type {
  InstallCatalogEntry,
  InstallEolPackageSummary,
  InstallNesPackageSummary,
  InstallSummary,
} from '../../types/install.ts';

/** Creates the per-run install summary populated by the local proxy. */
export function createInstallSummary(): InstallSummary {
  return {
    availableNotEntitled: new Map(),
    matchedNesPackages: new Map(),
    eolNoNesPackages: new Map(),
  };
}

/** Records a NES package the customer could install if they had entitlement. */
export function recordAvailableNotEntitled(
  summary: InstallSummary,
  ossPackageName: string,
  entry: InstallCatalogEntry,
): void {
  const item = toNesPackageSummary(ossPackageName, entry);
  summary.availableNotEntitled.set(getNesPackageSummaryKey(item), item);
}

/** Records a NES package successfully selected for this install run. */
export function recordMatchedNesPackage(
  summary: InstallSummary,
  ossPackageName: string,
  entry: InstallCatalogEntry,
): void {
  const item = toNesPackageSummary(ossPackageName, entry);
  summary.matchedNesPackages.set(getNesPackageSummaryKey(item), item);
}

/** Serializes install summary maps into analytics-friendly arrays while preserving counts. */
export function toInstallAnalyticsProperties(summary: InstallSummary): {
  eol_no_nes_count: number;
  eol_no_nes_packages: InstallEolPackageSummary[];
  nes_available_not_entitled_count: number;
  nes_available_not_entitled_packages: InstallNesPackageSummary[];
  nes_matched_package_count: number;
  nes_matched_packages: InstallNesPackageSummary[];
} {
  return {
    eol_no_nes_count: summary.eolNoNesPackages.size,
    eol_no_nes_packages: Array.from(summary.eolNoNesPackages.values()),
    nes_available_not_entitled_count: summary.availableNotEntitled.size,
    nes_available_not_entitled_packages: Array.from(summary.availableNotEntitled.values()),
    nes_matched_package_count: summary.matchedNesPackages.size,
    nes_matched_packages: Array.from(summary.matchedNesPackages.values()),
  };
}

/** Formats a concise user-facing summary of the proxy decisions made during install. */
export function formatInstallSummary(summary: InstallSummary): string {
  const lines: string[] = [];

  if (summary.matchedNesPackages.size > 0) {
    lines.push('Installed NES packages:');
    for (const item of getLatestPackageSummaries(summary.matchedNesPackages)) {
      lines.push(formatNesPackageSummaryItem(item));
    }
  }

  if (summary.availableNotEntitled.size > 0) {
    lines.push('NES packages available, but not included in your entitlement:');
    for (const item of getLatestPackageSummaries(summary.availableNotEntitled)) {
      lines.push(formatNesPackageSummaryItem(item));
    }
  }

  if (summary.eolNoNesPackages.size > 0) {
    lines.push('EOL packages without an available NES replacement:');
    for (const item of summary.eolNoNesPackages.values()) {
      lines.push(`- ${item.packageName}${item.version ? `@${item.version}` : ''}`);
    }
  }

  return lines.length > 0 ? lines.join('\n') : 'No NES package changes were made.';
}

function toNesPackageSummary(ossPackageName: string, entry: InstallCatalogEntry): InstallNesPackageSummary {
  return {
    ossPackageName,
    ossVersion: entry.ossVersion,
    nesPackageName: entry.nesPackageName,
    nesVersion: entry.nesVersion,
  };
}

function getNesPackageSummaryKey(item: InstallNesPackageSummary): string {
  return `${item.ossPackageName}@${item.ossVersion}->${item.nesPackageName}@${item.nesVersion}`;
}

function formatNesPackageSummaryItem(item: InstallNesPackageSummary): string {
  return `- ${item.ossPackageName}@${item.ossVersion} -> ${item.nesPackageName}@${item.nesVersion}`;
}

function getLatestPackageSummaries(packages: Map<string, InstallNesPackageSummary>): InstallNesPackageSummary[] {
  const latestByPackageName = new Map<string, InstallNesPackageSummary>();

  for (const item of packages.values()) {
    const current = latestByPackageName.get(item.ossPackageName);
    if (!current || semver.gt(item.ossVersion, current.ossVersion)) {
      latestByPackageName.set(item.ossPackageName, item);
    }
  }

  return Array.from(latestByPackageName.values()).sort((left, right) =>
    left.ossPackageName.localeCompare(right.ossPackageName),
  );
}
