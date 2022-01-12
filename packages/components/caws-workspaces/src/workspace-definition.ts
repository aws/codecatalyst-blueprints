export interface WorkspaceDefinition {
  schemaVersion: string;
  metadata: WorkspaceMetadata;
  components: WorkspaceComponent[];
}

export interface WorkspaceComponent {
  name: string;
  container: WorkspaceComponentContainer;
}

export interface WorkspaceComponentContainer {
  image: string;
  mountSources: boolean;
  command: string[];
}

export interface WorkspaceMetadata {
  name: string;
  version: string;
  displayName?: string;
  description: string;
  tags: string[];
  projectType: 'aws';
}
