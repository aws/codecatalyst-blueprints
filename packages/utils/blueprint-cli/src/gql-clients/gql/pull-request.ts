import { gql } from '@apollo/client/core';

export const CreateSourcePullRequest = gql`
  mutation CreateSourcePullRequest($input: CreateSourcePullRequestInput!) {
    createSourcePullRequest(input: $input) {
      number
    }
  }
`;
