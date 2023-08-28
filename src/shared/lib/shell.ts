const shelljs = require('shelljs');

interface shellOptions {
    returnCode: boolean,
    suppressExit: boolean,
    suppressStdOut: boolean,
};

const defaultRunOptions: shellOptions = {
    returnCode: false,
    suppressExit: true,
    suppressStdOut: true,
};

export function run<T>(command: string, config: Partial<shellOptions> = defaultRunOptions): Promise<T> {
    const options = { ...defaultRunOptions, ...config };

    return new Promise((resolve, reject) => {
        if (options.suppressStdOut) {
            shelljs.config.silent = true;
        }
        shelljs.exec(command, (code: any, stdout: any, stderr: any) => {
            if (stderr) {
                const errorOutput = options.returnCode ? code : stderr;
                reject(errorOutput);
                if (!options.suppressExit) {
                    process.exit(code);
                }
                return;
            }
            const output = options.returnCode ? code : stdout;
            if (!options.suppressStdOut) {
                console.log(output);
            }

            resolve(output);

        });
    });
}
