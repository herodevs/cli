import { webcrypto } from 'node:crypto';
import { vi } from 'vitest';

if (typeof globalThis.crypto === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
    writable: true,
  });
}

vi.mock('terminal-link', () => ({
  __esModule: true,
  default: (text: string | undefined, url: string | undefined) => `${text ?? ''} (${url ?? ''})`,
}));

vi.mock('update-notifier', () => ({
  __esModule: true,
  default: () => ({ notify: vi.fn(), update: undefined }),
}));
