import {
  WorkspaceCommand,
  WorkspaceCommandGroup,
  WorkspaceCommandGroupKind,
  WorkspaceDefinition,
  WorkspaceEvents,
  WorkspaceEventsPostStart,
} from '../workspace-definition';

//https://devfile.io/docs/2.0.0/devfile-schema#commands-exec-working-dir
export const DEFAULT_WORKING_DIR = '$PROJECT_SOURCE';

export function addPostStartEvent(
  definition: WorkspaceDefinition,
  options: {
    eventName: string;
    command: string;
    component: string;
    workingDirectory?: string;
    groupKind?: WorkspaceCommandGroupKind;
    groupIsDefault?: boolean;
  },
): void {
  const { eventName, command, component, workingDirectory, groupKind, groupIsDefault } = options;

  const postStartEvents: WorkspaceEventsPostStart = definition?.events?.postStart ?? [];
  postStartEvents.push(eventName);
  const events: WorkspaceEvents = definition.events ? { ...definition.events, postStart: postStartEvents } : { postStart: postStartEvents };

  const commands: WorkspaceCommand[] = definition.commands ?? [];
  const defaultGrouping: WorkspaceCommandGroup = {
    kind: groupKind!,
    isDefault: groupIsDefault ?? false,
  };
  const group = groupKind ? defaultGrouping : undefined;
  const newCommand: WorkspaceCommand = {
    id: eventName,
    exec: {
      commandLine: command,
      workingDir: workingDirectory ?? DEFAULT_WORKING_DIR,
      group,
      component: component,
    },
  };
  commands.push(newCommand);

  definition.events = events;
  definition.commands = commands;
}
