import { exec } from 'child_process';

export async function runCommand(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      timeout: 10000,
    };

    exec(cmd, options, (err, stdout, stderr) => {
      if (err) {
        const rejection = {
          err,
          stdout,
          stderr,
        };
        reject(rejection);
        return;
      }

      let result = stdout;
      if (typeof stdout === 'string') {
        result = (stdout || '').trim();
      }
      resolve(result);
    });
  });
}
