import { gql } from '@apollo/client/core';

export const ListAwsAccountAssociationsQuery = gql`
  query ListAwsAccountToEnvironmentAssociations($input: ListAwsAccountToEnvironmentAssociationsInput!) {
    listAwsAccountToEnvironmentAssociations(input: $input) {
      items {
        environmentName
        awsAccount {
          name
        }
      }
      nextToken
    }
  }
`;
