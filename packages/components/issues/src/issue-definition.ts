export interface IssueDefinition {
  title: string;
  content?: string;
  priority?: string;
  labels?: string[];
}

export interface IssueObject extends IssueDefinition {
  id: string;
}
