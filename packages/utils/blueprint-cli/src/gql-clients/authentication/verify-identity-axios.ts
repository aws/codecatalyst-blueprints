import * as axios from 'axios';
import { CodeCatalystAuthentication, generateAuthHeaders } from './get-codecatalyst-authentication';

export interface IdentityResponse {
  name: string;
  email: string;
  headers?: {
    'anti-csrftoken-a2z': string;
  };
}
export const verifyIdentity = async (endpoint: string, options: { authentication: CodeCatalystAuthentication }): Promise<IdentityResponse> => {
  const { authentication } = options;
  const gqlResponse = await axios.default.post(
    `https://${endpoint}/graphql?`,
    {
      query: `query verifySession {
        verifySession {
          self {
            displayName,
            primaryEmail {
              email,
            },
          }
        }
      }`,
    },
    {
      headers: {
        'authority': endpoint,
        'origin': `https://${endpoint}`,
        'accept': 'application/json',
        'content-type': 'application/json',
        ...generateAuthHeaders(authentication),
      },
    },
  );

  if (!gqlResponse.data.data.verifySession) {
    console.error('Could not verify identity!');
    console.log(gqlResponse.data);
    process.exit(1);
  }

  let response: IdentityResponse = {
    email: gqlResponse.data.data.verifySession.self.primaryEmail.email,
    name: gqlResponse.data.data.verifySession.self.displayName,
  };

  if (gqlResponse.headers['anti-csrftoken-a2z']) {
    response.headers = {
      'anti-csrftoken-a2z': gqlResponse.headers['anti-csrftoken-a2z'],
    };
  }
  return response;
};
