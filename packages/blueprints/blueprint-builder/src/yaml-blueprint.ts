import { BlueprintIntrospection } from './introspect-blueprint';

export interface Parameter {
  DisplayName: string;
  Description: string;
  Type: string;
  Path: string[];
  Annotations?: string[];
}
export interface ParameterLeaf extends Parameter {
  Default: string;
}

export interface ParameterMapping {
  [key: string]: ParameterLeaf | ParameterNest;
}

export interface ParameterNest extends Parameter {
  Nested: ParameterMapping;
}

interface StringMap {[key: string]: string | StringMap};
export interface Generation {
  Parent: string;
  Version: string;
  Parameters: StringMap;
}

export interface YAMLMetadata {
  DisplayName: string;
  Description: string;
  Package: string;
  Version: string;
  Author: string;
  Organization: string;
  License: string;
  Homepage?: string;
  MediaUrls?: string[];
  Keywords?: string[];
}

export interface YamlBlueprint {
  // metadata about the blueprint
  Info: YAMLMetadata;

  // The stuff we prompt the user for
  Parameters: Partial<ParameterMapping>;

  // mapping into the parent
  Generation: Generation;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapGenerationParameters = (defaults: ParameterMapping): Generation['Parameters'] => {
  const mapping = {};
  Object.entries(defaults).forEach(([key, value]) => {
    if (value['Nested']) {
      mapping[key] = mapGenerationParameters(value['Nested']);
    } else {
      mapping[key] = `{{${value.Path.join('.')}}}`;
    }
  });
  return mapping;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buildGenerationObject = (params: {
  parent: string;
  version: string;
  parameters: ParameterMapping;
}): Generation => {
  return {
    Parent: params.parent,
    Version: params.version,
    Parameters: mapGenerationParameters(params.parameters),
  };
};

export const buildParametersObject = (paramters: ParameterMapping): Partial<ParameterMapping> => {
  const mapping = {};
  Object.entries(paramters).forEach(([key, value]) => {
    if (value['Nested']) {
      mapping[key] = {
        ...value,
        Nested: buildParametersObject(value['Nested'])
      } 
    } else {
      mapping[key] = { ...value };
    }
    delete mapping[key].Path;
  });
  return mapping;
};

export const buildMetaDataObject = (params: {
  introspection: BlueprintIntrospection;
  metadata: YAMLMetadata;
}): YAMLMetadata => {
  const info = {
    ...params.metadata,
    License: params.introspection.packageJsonContent.license || 'MIT',
  };

  if (params.introspection.packageJsonContent.homepage) {
    info.Homepage = params.introspection.packageJsonContent.homepage;
  }
  if (params.introspection.packageJsonContent.mediaUrls) {
    info.MediaUrls = params.introspection.packageJsonContent.mediaUrls;
  }
  if (params.introspection.packageJsonContent.keywords) {
    info.Keywords = params.introspection.packageJsonContent.keywords;
  }
  return info;
};
