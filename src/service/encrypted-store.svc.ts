import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import Conf from 'conf';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export function getMachineKey(salt: string): Buffer {
  const hostname = os.hostname();
  const username = os.userInfo().username;
  const raw = `${hostname}:${username}:${salt}`;
  return crypto.createHash('sha256').update(raw, 'utf8').digest();
}

export function encryptValue(plaintext: string, salt: string): string {
  const key = getMachineKey(salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64url');
}

export function decryptValue(encoded: string, salt: string): string {
  const key = getMachineKey(salt);
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

export function createConfStore(configName: string): Conf<Record<string, unknown>> {
  const cwd = path.join(os.homedir(), '.hdcli');
  return new Conf<Record<string, unknown>>({
    projectName: 'hdcli',
    cwd,
    configName,
  });
}
