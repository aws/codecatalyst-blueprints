export interface NpmConfiguration {
  readonly registry?: string;
  readonly token?: string;
}

export interface Context {
  readonly organizationName?: string;
  readonly projectName?: string;
  readonly environmentId?: string;
  readonly rootDir: string;
  readonly npmConfiguration: NpmConfiguration;
}
