import debug from 'debug';

/**
 * A simple debug logger for services.
 * Services should only use debug logging for development/troubleshooting.
 * All user-facing output should be handled by commands.
 */
export const debugLogger = debug('oclif:herodevs-debug');

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === 'object') {
    return JSON.stringify(error);
  }
  return String(error) || 'Unknown error';
}
