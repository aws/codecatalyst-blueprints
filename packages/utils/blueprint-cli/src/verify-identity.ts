import * as axios from 'axios';

interface IdentityResponse {
  name: string;
  email: string;
  csrfToken: string;
}
export const verifyIdentity = async (options: {
  endpoint: string;
  cookie: string;
}): Promise<IdentityResponse> => {
  const { endpoint, cookie } = options;
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
        'accespt': 'application/json',
        'origin': `https://${endpoint}`,
        'cookie': cookie,
        'content-type': 'application/json',
      },
    },
  );
  return {
    email: gqlResponse.data.data.verifySession.self.primaryEmail.email,
    name: gqlResponse.data.data.verifySession.self.displayName,
    csrfToken: gqlResponse.headers['anti-csrftoken-a2z'],
  };
};
