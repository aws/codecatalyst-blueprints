import { CodeCatalystClient, GetUserDetailsCommand, VerifySessionCommand } from '@aws-sdk/client-codecatalyst';
import { HttpRequest } from '@smithy/protocol-http';
import * as pino from 'pino';

export const codecatalystClient = new CodeCatalystClient({ region: process.env.REGION ?? 'us-west-2' });

interface codecatalystIdentityResponse {
  name: string;
  email: string;
  authorization: any;
}

export async function codecatalystVerifyIdentity(log: pino.BaseLogger): Promise<codecatalystIdentityResponse> {
  let authorization;
  codecatalystClient.middlewareStack.add(
    next => async args => {
      const result = await next(args);
      authorization = (args.request as HttpRequest).headers.authorization;

      return result;
    },
    {
      step: 'finalizeRequest',
      name: 'codecatalyst-request-middleware',
    },
  );

  log.info('Send request to CodeCatalyst to VerifySession.');
  const session = await codecatalystClient.send(new VerifySessionCommand({}));

  log.info('Send request to CodeCatalyst to GetUserDetails.');
  const userDetails = await codecatalystClient.send(
    new GetUserDetailsCommand({
      id: session.identity,
    }),
  );

  return {
    name: userDetails.userName!,
    email: userDetails.primaryEmail?.email!,
    authorization: authorization,
  };
}
