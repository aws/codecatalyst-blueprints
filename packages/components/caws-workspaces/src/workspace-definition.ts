export interface WorkspaceDefinition {
  schemaVersion: string;
  metadata: WorkspaceMetadata;
  components: WorkspaceComponent[];
}

export interface WorkspaceComponent {
  name: string;
  container?: WorkspaceComponentContainer;
  volume?: WorkspaceComponentVolume;
}

export interface WorkspaceComponentContainer {
  image: string;
  mountSources: boolean;
  command: string[];
  volumeMounts: VolumeMount[];
}

export interface VolumeMount {
  name: string;
  path: string;
}

export interface WorkspaceComponentVolume {
  size: string;
}

export interface WorkspaceMetadata {
  name: string;
  version: string;
  displayName?: string;
  description: string;
  tags: string[];
  projectType: 'aws';
}
