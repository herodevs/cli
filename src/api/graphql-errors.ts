import type { GraphQLFormattedError } from 'graphql';

export type GraphQLErrorResult = {
  error?: unknown;
  errors?: ReadonlyArray<GraphQLFormattedError>;
};

export function getGraphQLErrors(result: GraphQLErrorResult): ReadonlyArray<GraphQLFormattedError> | undefined {
  if (result.errors?.length) {
    return result.errors;
  }

  const error = result.error;
  if (!error || typeof error !== 'object') {
    return;
  }

  if ('errors' in error) {
    const errors = (error as { errors?: ReadonlyArray<GraphQLFormattedError> }).errors;
    if (errors?.length) {
      return errors;
    }
  }

  if ('graphQLErrors' in error) {
    const errors = (error as { graphQLErrors?: ReadonlyArray<GraphQLFormattedError> }).graphQLErrors;
    if (errors?.length) {
      return errors;
    }
  }

  return;
}
