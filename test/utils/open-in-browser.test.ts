import type { ExecException } from 'node:child_process';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const execMock = vi.fn<[string, ((err: ExecException | null) => void)?], void>();
const platformMock = vi.fn<[], NodeJS.Platform>();

vi.mock('node:child_process', () => ({
  exec: execMock,
}));

vi.mock('node:os', () => ({
  platform: platformMock,
}));

describe('openInBrowser', () => {
  let openInBrowser: (url: string) => Promise<void>;

  beforeEach(async () => {
    execMock.mockReset();
    platformMock.mockReset();
    vi.resetModules();
    ({ openInBrowser } = await import('../../src/utils/open-in-browser.ts'));
  });

  it('uses macOS open command when platform is darwin', async () => {
    platformMock.mockReturnValue('darwin');
    execMock.mockImplementation((_cmd, cb) => cb?.(null));

    await expect(openInBrowser('https://example.com')).resolves.toBeUndefined();

    expect(execMock).toHaveBeenCalledWith('open "https://example.com"', expect.any(Function));
  });

  it('uses Windows start command when platform is win32', async () => {
    platformMock.mockReturnValue('win32');
    execMock.mockImplementation((_cmd, cb) => cb?.(null));

    await expect(openInBrowser('https://example.com')).resolves.toBeUndefined();

    expect(execMock).toHaveBeenCalledWith('start "" "https://example.com"', expect.any(Function));
  });

  it('falls back to xdg-open on other platforms', async () => {
    platformMock.mockReturnValue('linux');
    execMock.mockImplementation((_cmd, cb) => cb?.(null));

    await expect(openInBrowser('https://example.com')).resolves.toBeUndefined();

    expect(execMock).toHaveBeenCalledWith('xdg-open "https://example.com"', expect.any(Function));
  });

  it('rejects when the underlying command fails', async () => {
    platformMock.mockReturnValue('darwin');
    execMock.mockImplementation((_cmd, cb) => cb?.(new Error('boom')));

    await expect(openInBrowser('https://example.com')).rejects.toThrow('Failed to open browser: boom');
  });
});
