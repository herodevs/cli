import { spawn } from 'node:child_process';
import type { NpmInstallOptions, NpmInstallResult } from '../../types/install.ts';

/**
 * Runs the first-iteration install command through npm.
 *
 * The local registry and NES tarball auth are injected only through this child process
 * environment. We do not write to `.npmrc`, which keeps the behavior reversible.
 */
export function runNpmInstall(options: NpmInstallOptions): Promise<NpmInstallResult> {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['install'], {
      env: buildNpmInstallEnv(options),
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('close', (exitCode) => {
      resolve({ exitCode: exitCode ?? 1 });
    });
  });
}

function buildNpmInstallEnv(options: NpmInstallOptions): NodeJS.ProcessEnv {
  return {
    ...process.env,
    // Point only this npm invocation at the local proxy; do not mutate the user's npm config files.
    NPM_CONFIG_REGISTRY: options.registryUrl,
    ...buildNesRegistryAuthEnv(options.nesRegistryUrl, options.registryAuthToken ?? options.authToken),
  };
}

function buildNesRegistryAuthEnv(nesRegistryUrl: string, authToken: string): NodeJS.ProcessEnv {
  const registryUrl = new URL(nesRegistryUrl);
  const registryPath = registryUrl.pathname.endsWith('/') ? registryUrl.pathname : `${registryUrl.pathname}/`;

  // npm downloads stable NES tarball URLs directly from manifest metadata, outside our proxy.
  // Registry auth has to use npm's config key shape so only this child process can read the token.
  return {
    [`NPM_CONFIG_//${registryUrl.host}${registryPath}:_authToken`]: authToken,
  };
}
