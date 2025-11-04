export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

export const isErrnoException = (error: unknown): error is NodeJS.ErrnoException => {
  return isError(error) && 'code' in error;
};

export const isApolloError = (error: unknown): error is ApolloError => {
  return error instanceof ApolloError;
};

export const getErrorMessage = (error: unknown): string => {
  if (isError(error)) {
    return error.message;
  }
  return 'Unknown error';
};

export class ApolloError extends Error {
  public readonly originalError?: unknown;

  constructor(message: string, original?: unknown) {
    if (isError(original)) {
      super(`${message}: ${original.message}`);
    } else {
      super(`${message}: ${String(original)}`);
    }
    this.name = 'ApolloError';
    this.originalError = original;
  }
}
