import { exec } from 'node:child_process';
import { platform } from 'node:os';

export function openInBrowser(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const escapedUrl = `"${url.replace(/"/g, '\\"')}"`;

    const command = (() => {
      const plat = platform();

      if (plat === 'darwin') return `open ${escapedUrl}`; // macOS
      if (plat === 'win32') return `start "" ${escapedUrl}`; // Windows
      return `xdg-open ${escapedUrl}`; // Linux
    })();

    exec(command, (err) => {
      if (err) reject(new Error(`Failed to open browser: ${err.message}`));
      else resolve();
    });
  });
}
