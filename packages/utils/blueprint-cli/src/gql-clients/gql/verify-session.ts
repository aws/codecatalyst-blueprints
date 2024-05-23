import { gql } from '@apollo/client/core';

export const verifySession = gql`
  query VerifySession {
    VerifySession {
      self {
        displayName
        primaryEmail {
          email
        }
      }
    }
  }
`;
