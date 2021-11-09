export interface Variables {
  Name: string;
  Value: string;
}

export interface Step {
  Run: string;
}

export interface Artifacts {
  Name: string;
  Files: string[];
}
export interface Reports {
  Name: string;
  TestResults: {
    ReferenceArtifact: string;
    Format: string;
  };
}

export interface ActionConfiguration {
  ActionRoleArn?: string;
  Variables?: Variables[];
  Steps?: Step[];
  Artifacts?: Artifacts[];
  Reports?: Reports[];
}

export interface ActionDefiniton {
  Identifier?: string;
  OutputArtifacts?: string[];
  Configuration?: ActionConfiguration;
}

export interface TriggerDefiniton {
  Type: string;
  Branches?: string[];
  Events?: string[];
}

export interface WorkflowDefinition {
  Name: string;
  Triggers?: TriggerDefiniton[];
  Actions?: {
    [id: string]: ActionDefiniton;
  };
  DeployCloudFormationStack?: any;
}
