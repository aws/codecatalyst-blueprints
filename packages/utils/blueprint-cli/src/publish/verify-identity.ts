import * as axios from 'axios';
import { CodeCatalystAuthentication, generateHeaders } from './codecatalyst-authentication';

interface IdentityResponse {
  name: string;
  email: string;
  csrfToken?: string;
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
        ...generateHeaders(authentication),
      },
    },
  );

  if (!gqlResponse.data.data.verifySession) {
    console.error('Could not verify identity!');
    console.log(gqlResponse.data);
    process.exit(1);
  }

  return {
    email: gqlResponse.data.data.verifySession.self.primaryEmail.email,
    name: gqlResponse.data.data.verifySession.self.displayName,
    csrfToken: gqlResponse.headers['anti-csrftoken-a2z'],
  };
};
