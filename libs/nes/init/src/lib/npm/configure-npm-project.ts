import { existsSync, readFileSync, writeFileSync } from 'fs';
import { Entry } from '../models';
import path = require('path');

export function configureNpmProject(accessToken: string, packages: Entry[]) {
  updatePackageJson(packages);
  updateNpmrc(accessToken);
}

function updatePackageJson(packages: Entry[]) {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJsonContents = readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContents);

  const pkgUpdates = packages
    .map((p) => {
      let key = p.packageVersion.name;
      if (p.packageVersion.origination) {
        key = p.packageVersion.origination.name;
      }
      return {
        key: key,
        value: p.packageVersion.fqns,
      };
    })
    .reduce(
      (acc, cur) => {
        // Update the appropriate section of the package.json (dependencies if not dev or peer)
        if (packageJson.devDependencies && packageJson.devDependencies[cur.key]) {
          acc.devDeps[cur.key] = `npm:${cur.value}`;
        } else if (packageJson.peerDependencies && packageJson.peerDependencies[cur.key]) {
          acc.peerDeps[cur.key] = `npm:${cur.value}`;
        } else {
          acc.deps[cur.key] = `npm:${cur.value}`;
        }
        acc.overrides[cur.key] = { '.': `npm:${cur.value}` };
        return acc;
      },
      { deps: {}, devDeps: {}, peerDeps: {}, overrides: {} } as {
        deps: { [key: string]: string };
        devDeps: { [key: string]: string };
        peerDeps: { [key: string]: string };
        overrides: { [key: string]: { '.': string } };
      }
    );

  packageJson.dependencies = {
    ...(packageJson.dependencies || {}),
    ...pkgUpdates.deps,
  };
  packageJson.devDependencies = {
    ...(packageJson.devDependencies || {}),
    ...pkgUpdates.devDeps,
  };
  packageJson.peerDependencies = {
    ...(packageJson.peerDependencies || {}),
    ...pkgUpdates.peerDeps,
  };
  packageJson.overrides = {
    ...(packageJson.overrides || {}),
    ...pkgUpdates.overrides,
  };

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

function updateNpmrc(accessToken: string) {
  const npmrcPath = path.join(process.cwd(), '.npmrc');
  let npmrcContents = '';
  if (existsSync(npmrcPath)) {
    npmrcContents = readFileSync(npmrcPath, 'utf8');
  }

  if (npmrcContents.includes(`@neverendingsupport:registry`)) {
    return;
  }

  const updatedContents =
    npmrcContents +
    `\n\n` +
    `@neverendingsupport:registry=https://registry.nes.herodevs.com/npm/pkg/` +
    `\n` +
    `//registry.nes.herodevs.com/npm/pkg/:_authToken="${accessToken}"`;

  writeFileSync(npmrcPath, updatedContents);
}
