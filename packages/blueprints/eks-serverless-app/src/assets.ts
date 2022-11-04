import { RuntimeMapping, FileTemplateContext } from './models';

import path from 'path';

import { StaticAsset } from '@caws-blueprint-component/caws-source-repositories';

export const assets: RuntimeMapping = {
  filesToCreate: [
    {
      resolvePath(context: FileTemplateContext) {
        return path.join(context.repositoryRelativePath, 'app.py');
      },
      // @ts-ignore
      resolveContent(context: FileTemplateContext): string {
        return new StaticAsset('app.py').toString();
      },
    },
    {
      resolvePath(context: FileTemplateContext) {
        return path.join(context.repositoryRelativePath, 'kubernetes_objects', 'deployment.yaml');
      },
      // @ts-ignore
      resolveContent(context: FileTemplateContext): string {
        return new StaticAsset('kubernetes_objects/deployment.yaml').toString();
      },
    },
    {
      resolvePath(context: FileTemplateContext) {
        return path.join(context.repositoryRelativePath, 'kubernetes_objects', 'service.yaml');
      },
      // @ts-ignore
      resolveContent(context: FileTemplateContext): string {
        return new StaticAsset('kubernetes_objects/service.yaml').toString();
      },
    },

    {
      resolvePath(context: FileTemplateContext) {
        return path.join(context.repositoryRelativePath, 'build.sh');
      },
      // @ts-ignore
      resolveContent(context: FileTemplateContext): string {
        return new StaticAsset('build.sh').toString();
      },
    },
    {
      resolvePath(context: FileTemplateContext) {
        return path.join(context.repositoryRelativePath, 'cdk.json');
      },
      // @ts-ignore
      resolveContent(context: FileTemplateContext): string {
        return new StaticAsset('cdk.json').toString();
      },
    },
    {
      resolvePath(context: FileTemplateContext) {
        return path.join(context.repositoryRelativePath, 'eks_stack.py');
      },
      // @ts-ignore
      resolveContent(context: FileTemplateContext): string {
        return new StaticAsset('eks_stack.py').toString();
      },
    },
    {
      resolvePath(context: FileTemplateContext) {
        return path.join(context.repositoryRelativePath, 'requirements.txt');
      },
      // @ts-ignore
      resolveContent(context: FileTemplateContext): string {
        return new StaticAsset('requirements.txt').toString();
      },
    },
  ],
};
