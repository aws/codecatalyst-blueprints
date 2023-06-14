export interface NpmConfiguration {
  readonly registry?: string;
  readonly token?: string;
}

export interface PackageConfiguration {
  readonly name?: string;
  readonly version?: string;
}

export interface Context {
  readonly spaceName?: string;
  readonly projectName?: string;
  readonly environmentId?: string;
  readonly rootDir: string;
  readonly npmConfiguration: NpmConfiguration;
  readonly package: PackageConfiguration;
}
