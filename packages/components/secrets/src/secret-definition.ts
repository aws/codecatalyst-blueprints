/**
 * Generates a Secret input in the blueprint wizard. The UI prompts the user for a name, value and optional description.
 */
export type SecretDefinition = {
  name: string;
  description?: string;
};
