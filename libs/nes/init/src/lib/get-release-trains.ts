import { ApolloClient, gql, InMemoryCache } from '@apollo/client/core';
import { ReleaseTrain } from './models';

export async function getReleaseTrains(
  accessToken: string
): Promise<ReleaseTrain[]> {
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    uri: 'https://api.nes.herodevs.com/graphql',
  });

  try {
    const queryResult = await client.query({
      query: gql`
        query RT($input: LicensingReleaseTrainsInput) {
          licensing {
            releaseTrains(input: $input) {
              results {
                key
                name
                products {
                  id
                  key
                  name
                }
                entries {
                  packageVersion {
                    id
                    name
                    fqns
                    origination {
                      name
                      type
                      version
                    }
                  }
                }
              }
            }
          }
        }
      `,
      variables: { input: { tenantId: 1000, byToken: accessToken } },
    });

    const results = queryResult.data?.licensing?.releaseTrains?.results;
    if (!results) {
      throw new Error(`Error getting release trains`);
    }
    return results;
  } catch (error) {
    throw new Error(`Error getting release trains`);
  }
}
