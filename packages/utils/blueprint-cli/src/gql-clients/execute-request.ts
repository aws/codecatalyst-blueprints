import * as pino from 'pino';

export async function executeRequest<T>(
  log: pino.BaseLogger,
  request: Promise<T>,
  options: {
    description: string;
    purpose: string;
    [key: string]: string;
  },
): Promise<T> {
  try {
    // log.info({
    //   message: 'Starting request',
    //   ...options,
    // });
    const result = await request;
    // log.info({
    //   message: 'Request completed successfully',
    //   ...options,
    // });
    // log.debug({
    //   message: 'Request Response',
    //   ...options,
    //   result,
    // });
    return result;
  } catch (error) {
    log.warn(error as any);
    log.warn({
      message: 'Request did not respond successfully',
      ...options,
      error,
    });
    throw error;
  }
}
