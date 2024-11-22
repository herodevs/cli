import { ApolloClient, InMemoryCache } from '@apollo/client/core';
import { readFileSync, statSync } from 'node:fs';
import { TELEMETRY_INITIALIZE_MUTATION, TELEMETRY_REPORT_MUTATION } from './queries';
import { type JSONValue } from './types';
import { promptToProceedUploadFile } from './prompts';

const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri: 'https://api.nes.herodevs.com/graphql',
});

// I don't think this is the right key please change it :)
const MANIFEST_TELEMETRY_KEY = 'd7:diagnostics:report';

// This is the list of files that we are going to look for
const MANIFEST_FILES = [{ name: 'package.json' }];

const MAX_FILE_SIZE = 5e6; // 5MB

export async function initializeTelemetry(clientName: string) {
  return client.mutate({
    mutation: TELEMETRY_INITIALIZE_MUTATION,
    variables: { clientName },
  });
}

export async function sendTelemetryReport(
  oid: string,
  key: string,
  report: JSONValue,
  metadata: JSONValue
) {
  return client.mutate({
    mutation: TELEMETRY_REPORT_MUTATION,
    variables: { key, report, metadata },
    context: {
      headers: {
        'x-nes-telrep': oid,
      },
    },
  });
}

export async function getClientToken(clientName: string): Promise<string> {
  try {
    const { data } = await initializeTelemetry(clientName);
    const { success, oid, message } = data.telemetry.initialize;
    if (!success) {
      throw new Error(message);
    }
    return oid;
  } catch (error) {
    console.error('Error sending telemetry mutation:', error);
    throw error;
  }
}

export async function sendManifest(
  oid: string,
  manifest: JSONValue,
  metadata: JSONValue
): Promise<void> {
  try {
    const { data } = await sendTelemetryReport(oid, MANIFEST_TELEMETRY_KEY, manifest, metadata);
    const { success, message } = data.telemetry.report;
    if (!success) {
      throw new Error(message);
    }
  } catch (error) {
    console.error('Error sending report mutation:', error);
    throw error;
  }
}

async function readManifestFile(fileName: string) {
  const file = statSync(fileName);
  // Does not exist
  if (!file) {
    return;
  }

  // Empty file
  if (file.size === 0) {
    console.warn(`File ${fileName} is empty`);
    return;
  }

  // Cap the file size to prevent abuse
  if (file.size > MAX_FILE_SIZE) {
    console.warn(`File ${fileName} is too large`);
    return;
  }

  // Ask the user if they want to proceed
  const proceed = await promptToProceedUploadFile(fileName);
  if (!proceed) {
    return;
  }

  return readFileSync(fileName, 'utf-8');
}

export async function findManifestFile() {
  for (const manifest of MANIFEST_FILES) {
    const data = await readManifestFile(manifest.name);
    if (!data) {
      continue;
    }
    // For now we are only going to send the first file
    return {
      name: manifest.name,
      data,
    };
  }
  return;
}
