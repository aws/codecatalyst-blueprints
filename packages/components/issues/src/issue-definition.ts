export interface IssueDefinition {
  title: string;
  content?: string;
  priority?: string;
}

export interface IssueObject extends IssueDefinition {
  id: string;
}