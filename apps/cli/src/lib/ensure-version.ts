// eslint-disable-next-line @nx/enforce-module-boundaries
import * as getJson from 'get-json';
import { Color, color } from './log-colors';

const red = color(Color.FgRed);
const yellow = color(Color.FgYellow);

async function getLatestVersion(pkgName: string) {
  return getJson(`https://registry.npmjs.org/${pkgName}`).then(
    (packageData: { 'dist-tags': { latest: string } }) => {
      return packageData['dist-tags'].latest;
    }
  );
}

export async function isVersionUpToDate(
  packageName: string,
  packageVersion: string,
  quietIfSuccessful = false
): Promise<boolean> {
  if (packageVersion === '0.0.0') {
    return true;
  }
  const latestVersion = await getLatestVersion(packageName);
  if (latestVersion === packageVersion) {
    if (!quietIfSuccessful) {
      console.log(`${packageName}@${latestVersion} is up to date`);
    }
    return true;
  }
  console.log(
    `${yellow(
      'Your version:',
      red(`${packageName}@${packageVersion}`),
      `is not up to date`
    )}`
  );
  console.log(
    `${yellow('Latest version:', red(`${packageName}@${latestVersion}...`))}`
  );
  return false;
}

export async function ensureVersionIsUpToDate(
  packageName: string,
  packageVersion: string
): Promise<void> {
  const versionUpToDate = await isVersionUpToDate(packageName, packageVersion);
  if (!versionUpToDate) {
    // see `update-plugin-behavior` branch for previous implementation of auto-update

    console.log(
      [
        `\n- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\n\n`,
        `${red(`ERROR:`)} Did not run command.\n\n`,
        ` - Rerun your command with the ${yellow(
          '@latest'
        )} tag to ensure correct output:\n\n\n`,
        `\t${yellow(`npx ${packageName}@latest`)}\n`,
        `\n\n- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\n`,
      ].join(' ')
    );

    return process.exit(1);
  }
}
