import { run } from './shell';
import { env } from '../config';
import { Command } from '@oclif/core';
import * as getJson from 'get-json';
import { Color, color } from '../enums';

const red = color(Color.FgRed);
const yellow = color(Color.FgYellow);

function reconstituteCommandPositionalsAndFlags(command: Command | any): string {
  return [
    ...command.id?.split(':'),
    ...Object.keys(command.flags).map((flag) => `--${flag}='${command.flags[flag]}'`),
  ].join(' ');
}

async function getLatestVersion(pkgName: string) {
  return getJson(`https://registry.npmjs.org/${pkgName}`).then((packageData) => {
    return packageData['dist-tags'].latest;
  });
}

export async function isVersionUpToDate(
  command: Command,
  quietIfSuccessful = false
): Promise<boolean> {
  const latestVersion = await getLatestVersion(env.packageName);
  if (latestVersion === env.packageVersion) {
    if (!quietIfSuccessful) {
      command.log(`${env.packageName}@${latestVersion} is up to date`);
    }
    return true;
  }
  command.log(
    `${yellow(
      'Your version:',
      red(`${env.packageName}@${env.packageVersion}`),
      `is not up to date`
    )}`
  );
  command.log(`${yellow('Latest version:', red(`${env.packageName}@${latestVersion}`))}`);
  return false;
}

export async function ensureVersionIsUpToDate(command: Command): Promise<void> {
  const versionUpToDate = await isVersionUpToDate(command);
  if (!versionUpToDate) {
    // see `update-plugin-behavior` branch for previous implementation of auto-update

    const commandAndPositionals = reconstituteCommandPositionalsAndFlags(command);

    command.log(
      [
        `\n- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\n\n`,
        `${red(`ERROR:`)} Did not run command.\n\n`,
        ` - Rerun your command with the ${yellow('@latest')} tag to ensure correct output:\n\n\n`,
        `\t${yellow(`npx ${env.packageName}@latest ${commandAndPositionals}`)}\n`,
        `\n\n- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\n`,
      ].join(' ')
    );

    return process.exit(1);
  }
}
