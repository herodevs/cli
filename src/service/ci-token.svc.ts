import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import Conf from 'conf';
import { config } from '../config/constants.ts';

const CI_TOKEN_STORAGE_KEY = 'ciRefreshToken';
const CI_ORG_ID_STORAGE_KEY = 'ciOrgId';
const ENCRYPTION_SALT = 'hdcli-ci-token-v1';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getConfStore(): Conf<Record<string, unknown>> {
  const cwd = path.join(os.homedir(), '.hdcli');
  return new Conf<Record<string, unknown>>({
    projectName: 'hdcli',
    cwd,
    configName: 'ci-token',
  });
}

function getMachineKey(): Buffer {
  const hostname = os.hostname();
  const username = os.userInfo().username;
  const raw = `${hostname}:${username}:${ENCRYPTION_SALT}`;
  return crypto.createHash('sha256').update(raw, 'utf8').digest();
}

export function encryptToken(plaintext: string): string {
  const key = getMachineKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64url');
}

export function decryptToken(encoded: string): string {
  const key = getMachineKey();
  const combined = Buffer.from(encoded, 'base64url');
  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Invalid encrypted token format');
  }
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext).toString('utf8') + decipher.final('utf8');
}

export function getCITokenFromStorage(): string | undefined {
  const store = getConfStore();
  const encoded = store.get(CI_TOKEN_STORAGE_KEY) as string | undefined;
  if (encoded === undefined || typeof encoded !== 'string') {
    return undefined;
  }
  try {
    return decryptToken(encoded);
  } catch {
    return undefined;
  }
}

export function getCIToken(): string | undefined {
  const fromEnv = config.ciTokenFromEnv;
  if (fromEnv !== undefined) {
    return fromEnv;
  }
  return getCITokenFromStorage();
}

export function saveCIToken(token: string): void {
  const store = getConfStore();
  const encoded = encryptToken(token);
  store.set(CI_TOKEN_STORAGE_KEY, encoded);
}

export function clearCIToken(): void {
  const store = getConfStore();
  store.delete(CI_TOKEN_STORAGE_KEY);
  store.delete(CI_ORG_ID_STORAGE_KEY);
}

export function getCIOrgId(): number | undefined {
  const store = getConfStore();
  const value = store.get(CI_ORG_ID_STORAGE_KEY);
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    return undefined;
  }
  return value;
}

export function saveCIOrgId(orgId: number): void {
  const store = getConfStore();
  store.set(CI_ORG_ID_STORAGE_KEY, orgId);
}

export function clearCIOrgId(): void {
  const store = getConfStore();
  store.delete(CI_ORG_ID_STORAGE_KEY);
}
