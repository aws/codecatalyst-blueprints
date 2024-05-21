import { gql } from '@apollo/client/core';

export const listSecretsQuery = gql`
  query listSecrets($input: ListSecretsInput!) {
    listSecrets(input: $input) {
      items {
        name
        description
      }
      nextToken
    }
  }
`;
