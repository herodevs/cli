import { run } from './shell';
import { env } from '../config';
import { Command } from '@oclif/core';
import latestVersion from '@badisi/latest-version';

async function wrapCommandToHandleDebugging<T>(command: string, message: string, commandInstance: Command): Promise<T> {
    let result = '';
    try {
        result = await run(command);
    } catch(ex: any) {
        console.info('EX', ex);
        // if command fails because debugger is attached, log the message
        if (
            !!~ex.toString().toLowerCase().indexOf('debugger attached') ||
            !!~ex.toString().toLowerCase().indexOf('the following package')
        ) {
            commandInstance.log(message);
        } else {
            commandInstance.log(command);
            commandInstance.error(ex);
        }
    }
    return result as T;
}

export async function isVersionUpToDate(command: Command, quietIfSuccessful = false): Promise<boolean> {
    const versionData = await latestVersion(env.packageName);
    if (versionData && versionData.latest && versionData.latest === env.packageVersion) {
        if (!quietIfSuccessful) {
            command.log(`${env.packageName}@${versionData.latest} is up to date`);
        }
        return true;
    }
    command.log(`Your version: ${env.packageName}@${env.packageVersion} is not up to date`);
    command.log(`Latest version: ${env.packageName}@${versionData.latest}`);
    return false;
}

export async function ensureVersionIsUpToDate(command: Command): Promise<void> {
    const versionUpToDate = await isVersionUpToDate(command);
    if (!versionUpToDate) {
        // clear npx cache
        await wrapCommandToHandleDebugging(
            `npx clear-npx-cache`,
            `DEBUGGING: skipping clear cache`,
            command
        );

        // update package
        const updated = await wrapCommandToHandleDebugging(
            `npm_config_yes=true npx -q ${env.packageName}@latest update verify`,
            `DEBUGGING: skipping package update`,
            command
        );

        if (updated) {
            command.log([
                `\n- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\n\n`,
                `The ${env.packageName} package was updated; however, you must re-run your command.`,
                `\n\n- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\n`,
            ].join(' '));

            await command.config.runCommand('update:verify', ['-q']);
        }

        return process.exit(1);
    }
}
