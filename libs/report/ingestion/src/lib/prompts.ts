import { confirm, input } from '@inquirer/prompts';
import { ArgumentsCamelCase } from 'yargs';
import { type Options } from './types';

export async function askConsent(args: ArgumentsCamelCase<Options>): Promise<boolean> {
  const consentPrompt = 'Data may contain sensitive data, please review before sharing it.';
  if (!args.consent) {
    const answer = await confirm({
      message: `${consentPrompt} Continue?`,
    });
    if (!answer) {
      return false;
    }
  } else {
    console.log(consentPrompt);
  }
  return true;
}

export async function promptClientName() {
  const name = await input({
    message: "Please enter your company's name:",
    validate: (value) => (value.trim() === '' ? 'Name cannot be empty!' : true),
  });
  return name;
}

export async function promptToProceedUploadFile(fileName: string): Promise<boolean> {
  const consentPrompt = `Found ${fileName}, this file will be uploaded.`;
  const answer = await confirm({
    message: `${consentPrompt} Continue?`,
  });
  if (!answer) {
    return false;
  }
  return true;
}
