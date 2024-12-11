import { ApolloClient, InMemoryCache } from '@apollo/client/core';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { promptToProceedUploadFile } from './prompts';
import { TELEMETRY_INITIALIZE_MUTATION, TELEMETRY_REPORT_MUTATION } from './queries';
import { type JSONValue } from './types';
import 'isomorphic-fetch';

const NES_REPORT_URL = process.env['NES_REPORT_URL'] || 'https://api.nes.herodevs.com/graphql';

const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri: NES_REPORT_URL,
});

const MANIFEST_TELEMETRY_KEY = 'ingest:project:report';

// This is the list of files that we are going to look for
const MANIFEST_FILES = [{ name: 'package.json' }];

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

function getUserAgent() {
  // This env var is set by npm when launching the script
  // https://docs.npmjs.com/cli/v9/using-npm/scripts#packagejson-vars
  return `hdcli/${process.env['npm_package_version'] ?? 'unknown'}`;
}

export async function initializeTelemetry(clientName: string) {
  return client.mutate({
    mutation: TELEMETRY_INITIALIZE_MUTATION,
    variables: { clientName },
    context: {
      headers: {
        'User-Agent': getUserAgent(),
      },
    },
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
        'User-Agent': getUserAgent(),
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
  const exists = existsSync(fileName);
  if (!exists) {
    console.log(`${fileName} not found`);
    return;
  }

  const file = statSync(fileName);

  // Empty file
  if (file.size === 0) {
    console.warn(`[WARN] Ignoring file ${fileName}, because it is empty`);
    return;
  }

  // Cap the file size to prevent abuse
  if (file.size > MAX_FILE_SIZE) {
    console.warn(`[WARN] Ignoring file ${fileName}, because it is too large`);
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
