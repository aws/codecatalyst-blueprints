export interface NpmConfiguration {
  readonly registry?: string;
  readonly token?: string;
}

export interface Context {
  readonly spaceName?: string;
  readonly projectName?: string;
  readonly environmentId?: string;
  readonly rootDir: string;
  readonly npmConfiguration: NpmConfiguration;
}
