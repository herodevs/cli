import { debugLogger } from '../service/log.svc.ts';

export type RetryOptions = {
  attempts: number;
  baseDelayMs: number;
  onRetry?: (info: { attempt: number; delayMs: number; error: unknown }) => void;
  finalErrorMessage?: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetries<T>(operation: string, fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const { attempts, baseDelayMs, onRetry, finalErrorMessage } = options;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === attempts) {
        break;
      }

      const delayMs = baseDelayMs * attempt;
      if (onRetry) {
        onRetry({ attempt, delayMs, error });
      } else {
        debugLogger('Retry (%s) attempt %d/%d after %dms: %o', operation, attempt, attempts, delayMs, error);
      }
      await sleep(delayMs);
    }
  }

  throw new Error(finalErrorMessage ?? 'Please contact your administrator.');
}
