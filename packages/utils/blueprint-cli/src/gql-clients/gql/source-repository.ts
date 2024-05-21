import { gql } from '@apollo/client/core';

export const GetSourceRepositoryCloneUrlQuery = gql`
  query GetSourceRepositoryCloneUrls($input: GetSourceRepositoryCloneUrlsInput!) {
    getSourceRepositoryCloneUrls(input: $input) {
      https
    }
  }
`;

export const ListSourceRepositoriesQuery = gql`
  query listSourceRepositories($input: ListSourceRepositoriesInputMigrationInput!) {
    listSourceRepositoriesMigration(input: $input) {
      items {
        name
      }
      nextToken
    }
  }
`;
