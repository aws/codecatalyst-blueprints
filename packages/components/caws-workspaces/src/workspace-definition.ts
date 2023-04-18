export interface WorkspaceDefinition {
  schemaVersion: string;
  metadata: WorkspaceMetadata;
  components: WorkspaceComponent[];
  events?: WorkspaceEvents;
  commands?: WorkspaceCommand[];
}

export interface WorkspaceComponent {
  name: string;
  container?: WorkspaceComponentContainer;
  volume?: WorkspaceComponentVolume;
}

export interface WorkspaceComponentContainer {
  image: string;
  mountSources: boolean;
  command?: string[];
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

//https://devfile.io/docs/2.0.0/devfile-schema#events
//Note: events to be added in later postStop, preStart, preStop
export interface WorkspaceEvents {
  postStart?: WorkspaceEventsPostStart;
}

export type WorkspaceEventsPostStart = string[];

export interface WorkspaceCommand {
  id: string;
  exec: {
    commandLine: string;
    workingDir: string;
    group?: WorkspaceCommandGroup;
    component: string;
  };
}

export interface WorkspaceCommandGroup {
  kind: WorkspaceCommandGroupKind;
  isDefault: boolean;
}

//https://devfile.io/docs/2.0.0/devfile-schema#commands-exec-group
export enum WorkspaceCommandGroupKind {
  BUILD = 'build',
  RUN = 'run',
  TEST = 'test',
  DEBUG = 'debug',
}
