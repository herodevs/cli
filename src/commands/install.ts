import { Command, ux } from '@oclif/core';
import { track } from '../service/analytics.svc.ts';
import { requireAccessToken } from '../service/auth.svc.ts';
import { loadInstallCatalog } from '../service/install/catalog.svc.ts';
import {
  createInstallSummary,
  formatInstallSummary,
  toInstallAnalyticsProperties,
} from '../service/install/install-summary.svc.ts';
import { runNpmInstall } from '../service/install/npm-runner.svc.ts';
import { startInstallProxy } from '../service/install/proxy-server.svc.ts';
import { getNesRegistryAuthToken } from '../service/install/registry-auth.svc.ts';
import { getErrorMessage } from '../service/log.svc.ts';

const INSTALL_CATALOG_URL_ENV = 'HD_INSTALL_CATALOG_URL';
const INSTALL_NES_REGISTRY_AUTH_TOKEN_ENV = 'HD_INSTALL_NPM_REGISTRY_AUTH_TOKEN';
const INSTALL_NES_REGISTRY_URL_ENV = 'HD_INSTALL_NPM_REGISTRY_URL';
const DEFAULT_NES_REGISTRY_URL = 'https://registry.nes.herodevs.com/npm/pkg';

/**
 * Orchestrates the first `hd install` flow.
 *
 * This command intentionally stays thin: auth, proxy lifecycle, a plain npm install invocation,
 * and aggregate analytics. Package mapping, NES entitlement decisions, and reporting belong in
 * install services so each step can be reviewed independently.
 */
export default class Install extends Command {
  static override description = 'Install dependencies through the HeroDevs NES npm proxy';

  async run() {
    await this.parse(Install);

    let authToken: string;
    try {
      ux.action.start('Checking HeroDevs authentication');
      authToken = await requireAccessToken();
      ux.action.stop('ready');
    } catch (error) {
      ux.action.stop('failed');
      this.error(`Must be logged in to install NES packages. Run 'hd auth login' first. ${getErrorMessage(error)}`);
    }

    track('CLI Install Started', (context) => ({
      command: 'install',
      app_used: context.app_used,
      ci_provider: context.ci_provider,
      cli_version: context.cli_version,
      started_at: context.started_at,
    }));

    ux.action.start('Loading NES catalog');
    const catalog = await loadInstallCatalog({
      authToken,
      catalogUrl: process.env[INSTALL_CATALOG_URL_ENV],
      onProgress: (message) => {
        ux.action.status = message;
      },
    });
    ux.action.stop(`${catalog.size} npm package mappings`);
    const summary = createInstallSummary();

    const nesRegistryUrl = process.env[INSTALL_NES_REGISTRY_URL_ENV] ?? DEFAULT_NES_REGISTRY_URL;
    const registryAuthTokenOverride = process.env[INSTALL_NES_REGISTRY_AUTH_TOKEN_ENV]?.trim();
    let registryAuthToken: string;
    if (registryAuthTokenOverride) {
      registryAuthToken = registryAuthTokenOverride;
    } else {
      try {
        ux.action.start('Preparing NES registry authentication');
        registryAuthToken = await getNesRegistryAuthToken();
        ux.action.stop('ready');
      } catch (error) {
        ux.action.stop('failed');
        this.error(`Unable to authenticate with the NES registry. ${getErrorMessage(error)}`);
      }
    }

    ux.action.start('Starting local npm proxy');
    const proxy = await startInstallProxy({
      authToken,
      catalog,
      registryAuthToken,
      summary,
      nesRegistryUrl,
    });
    ux.action.stop(proxy.registryUrl);

    let npmExitCode = 1;
    try {
      const result = await runNpmInstall({
        authToken,
        nesRegistryUrl,
        registryAuthToken,
        registryUrl: proxy.registryUrl,
      });
      npmExitCode = result.exitCode;
    } catch (error) {
      track('CLI Install Failed', () => ({
        command: 'install',
        error: getErrorMessage(error),
      }));
      this.error(`Install failed. ${getErrorMessage(error)}`);
    } finally {
      await proxy.close();
    }

    if (npmExitCode !== 0) {
      track('CLI Install Failed', () => ({
        command: 'install',
        error: `npm_exit_code:${npmExitCode}`,
        ...toInstallAnalyticsProperties(summary),
      }));
      this.exit(npmExitCode);
    }

    track('CLI Install Succeeded', () => ({
      command: 'install',
      ...toInstallAnalyticsProperties(summary),
    }));
    this.log(formatInstallSummary(summary));
    this.log('Install completed.');
  }
}
