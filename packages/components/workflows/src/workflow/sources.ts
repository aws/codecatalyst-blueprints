export type SourceType = 'SOURCE_REPOSITORY';

export interface SourceDefiniton {
  Type: SourceType;
  RepositoryName: string;
  branch: string;
}
