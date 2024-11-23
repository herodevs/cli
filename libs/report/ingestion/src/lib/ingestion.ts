import { type ArgumentsCamelCase, type CommandModule } from 'yargs';
import { askConsent, promptClientName, promptToProceedUploadFile } from './prompts';
import { findManifestFile, getClientToken, sendManifest } from './send-manifest';
import { type Options } from './types';

export const reportIngestionCommand: CommandModule<object, Options> = {
  command: 'generate',
  describe: 'send manifest files information',
  aliases: ['gen', 'g'],
  builder: {
    consent: {
      describe: 'Agree to understanding that sensitive data may be sent to the server',
      required: false,
      default: false,
      boolean: true,
    },
  },
  handler: run,
};

async function run(args: ArgumentsCamelCase<Options>): Promise<void> {
  const consent = await askConsent(args);
  if (!consent) {
    return;
  }
  // Prompt the user to insert their name
  const clientName = await promptClientName();
  // First we need to get a short lived token
  const oid = await getClientToken(clientName);

  const manifest = await findManifestFile();
  if (!manifest) {
    console.log('No manifest files found');
    return;
  }

  await sendManifest(oid, manifest, { clientName });
  console.log('Manifest sent successfully!');
}
