import { gql } from '@apollo/client/core';

// export const GetEnvironmentQuery = gql`
//   query GetEnvironment($input: GetEnvironmentInput!) {
//     getEnvironment(input: $input) {
//       name
//       description
//       lastUpdatedTime
//       environmentType
//       vpcConnection {
//         vpcConnectionName
//       }
//     }
//   }
// `;

export const ListEnvironmentQuery = gql`
  query listEnvironments($input: ListEnvironmentsInput!) {
    listEnvironments(input: $input) {
      items {
        name
        description
        environmentType
      }
      nextToken
    }
  }
`;
