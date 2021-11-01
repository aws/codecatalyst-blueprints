import { BlueprintIntrospection } from './introspect-blueprint'

export const buildDefaults = (originBlueprint: BlueprintIntrospection): string => {
  return JSON.stringify(originBlueprint.defaults)
}
