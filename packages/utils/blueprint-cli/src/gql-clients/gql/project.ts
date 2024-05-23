import { gql } from '@apollo/client/core';

export const GetProjectQuery = gql`
  query getProject($input: GetProjectInput!) {
    getProject(input: $input) {
      id
      displayName
      description
    }
  }
`;
