export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

export const isErrnoException = (error: unknown): error is NodeJS.ErrnoException => {
  return isError(error) && 'code' in error;
};
