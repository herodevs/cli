import * as https from 'https';
import { Color, color } from './log-colors';

const red = color(Color.FgRed);
const yellow = color(Color.FgYellow);

async function getLatestVersion(pkgName: string) {
  const url = `https://registry.npmjs.org/${pkgName}`;
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const request = https.get(url, options, (response) => {
      const chunks: string[] = [];

      response.on('data', (chunk) => chunks.push(chunk));

      response.on('error', reject);

      response.on('end', () => {
        const validResponse = response.statusCode
          ? response.statusCode >= 200 && response.statusCode <= 299
          : true;
        const body = chunks.join('');

        if (validResponse) {
          resolve(JSON.parse(body)['dist-tags'].latest);
        } else
          reject(
            new Error(`Request failed. status: ${response.statusCode || 'N/A'}, body: ${body}`)
          );
      });
    });

    request.on('error', (err) => {
      reject(err);
    });
  });
}

export async function isVersionUpToDate(
  packageName: string,
  packageVersion: string
): Promise<boolean> {
  if (packageVersion.startsWith('0.0.0')) {
    return true;
  }
  const latestVersion = await getLatestVersion(packageName);
  if (latestVersion === packageVersion) {
    return true;
  }
  console.log(
    `${yellow('Your version:', red(`${packageName}@${packageVersion}`), `is not up to date`)}`
  );
  console.log(`${yellow('Latest version:', red(`${packageName}@${latestVersion}...`))}`);
  return true;
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
        ` - Rerun your command with the ${yellow('@latest')} tag to ensure correct output:\n\n\n`,
        `\t${yellow(`npx ${packageName}@latest`)}\n`,
        `\n\n- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\n`,
      ].join(' ')
    );

    return process.exit(1);
  }
}
