import { vi } from 'vitest';

const store = new Map<string, unknown>();

const mockCiTokenFromEnv = { value: undefined as string | undefined };

vi.mock('../../src/config/constants.ts', () => ({
  config: {
    get ciTokenFromEnv(): string | undefined {
      const v = mockCiTokenFromEnv.value;
      return v === undefined || v === '' ? undefined : v;
    },
  },
}));

vi.mock('conf', () => ({
  default: class MockConf {
    get(key: string): unknown {
      return store.get(key);
    }

    set(key: string, value: unknown): void {
      store.set(key, value);
    }

    delete(key: string): void {
      store.delete(key);
    }

    has(key: string): boolean {
      return store.has(key);
    }
  },
}));

import {
  clearCIToken,
  decryptToken,
  encryptToken,
  getCIToken,
  getCITokenFromStorage,
  saveCIToken,
} from '../../src/service/ci-token.svc.ts';

describe('ci-token.svc', () => {
  beforeEach(() => {
    store.clear();
    mockCiTokenFromEnv.value = undefined;
  });

  describe('encryptToken / decryptToken', () => {
    it('round-trips a plaintext token', () => {
      const plain = 'refresh-token-abc';
      const encrypted = encryptToken(plain);
      expect(encrypted).not.toBe(plain);
      expect(decryptToken(encrypted)).toBe(plain);
    });

    it('produces different ciphertext each time due to random IV', () => {
      const plain = 'same-token';
      const a = encryptToken(plain);
      const b = encryptToken(plain);
      expect(a).not.toBe(b);
      expect(decryptToken(a)).toBe(plain);
      expect(decryptToken(b)).toBe(plain);
    });

    it('throws on invalid encrypted format', () => {
      expect(() => decryptToken('not-valid-base64!!!')).toThrow(/Invalid encrypted token format/);
    });
  });

  describe('getCITokenFromStorage / saveCIToken / clearCIToken', () => {
    it('returns undefined when storage is empty', () => {
      expect(getCITokenFromStorage()).toBeUndefined();
    });

    it('saves and retrieves token from storage (encrypted)', () => {
      saveCIToken('my-refresh-token');
      expect(getCITokenFromStorage()).toBe('my-refresh-token');
    });

    it('clearCIToken removes stored token', () => {
      saveCIToken('token');
      clearCIToken();
      expect(getCITokenFromStorage()).toBeUndefined();
    });
  });

  describe('getCIToken', () => {
    it('returns config.ciTokenFromEnv when set', () => {
      mockCiTokenFromEnv.value = 'env-token';
      expect(getCIToken()).toBe('env-token');
    });

    it('prefers config.ciTokenFromEnv over storage', () => {
      mockCiTokenFromEnv.value = 'env-token';
      saveCIToken('storage-token');
      expect(getCIToken()).toBe('env-token');
    });

    it('falls back to storage when config.ciTokenFromEnv is unset', () => {
      mockCiTokenFromEnv.value = undefined;
      saveCIToken('storage-token');
      expect(getCIToken()).toBe('storage-token');
    });

    it('returns undefined when neither config.ciTokenFromEnv nor storage has token', () => {
      mockCiTokenFromEnv.value = undefined;
      expect(getCIToken()).toBeUndefined();
    });
  });
});
