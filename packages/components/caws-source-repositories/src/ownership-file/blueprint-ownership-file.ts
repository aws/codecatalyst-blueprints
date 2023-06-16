import * as path from 'path';
import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { File } from '../files/file';
import { MergeStrategies } from '../lifecycle/merge-strategy';
import { Strategy } from '../lifecycle/models';
import { SourceRepository } from '../repository';

/**
 * File in which we record ownership preferences and overrides
 */
export const BLUEPRINT_OWNERSHIP_FILE = 'blueprint.ownership';

export interface BlueprintOwnershipFileDefinition {
  filePath?: string;

  /**
   * This controls how files are merged when a user runs re-synthesis.
   *
   * Resynthesis is typically run when an update to a blueprint results in bug fixes or other changes in generated code.
   * This will result in a depend-a-bot style PR into customer generated codebases.
   *
   * You should assume that the same or similar options are passed during resynthesis, if the options diverge too much,
   * (e.g. changing the language) it might not be possible to effectively reason about needed changes. This might still
   * result in a valid synthesis, but will likely require the customer to do some work to manually fix merge conflicts.
   *
   * This can also happen if the blueprint interface adds backwards breaking changes to it's shape, prior used options
   * will no longer work.
   */
  resynthesis?: {
    strategies: Strategy[];
  };
}

export class BlueprintOwnershipFileSyntaxError extends Error {
  lineNumber: number;

  constructor(message: string, lineNumber: number) {
    super(`Error parsing blueprint ownership file: line ${lineNumber}: ${message}`);
    this.lineNumber = lineNumber;
  }
}

/**
 * Blueprint ownership file, lays out ownership delegation in a repository.
 */
export class BlueprintOwnershipFile extends File {
  public static asString = (blueprint: Blueprint, fileDefinition: BlueprintOwnershipFileDefinition): string => {
    let fileContents = '';

    fileDefinition.resynthesis?.strategies.forEach(strategy => {
      const owner = strategy.owner ?? blueprint.context.package.name;
      if (!owner) {
        throw new Error(
          `Failed to resolve owner for strategy ${strategy.identifier}: no owner was provided, and the blueprint context is missing a package name`,
        );
      }

      fileContents += `[${strategy.identifier}] ${owner}\n`;

      if (strategy.description) {
        // TODO: format description into multiple lines with a max length
        fileContents += `# ${strategy.description}\n`;
      }

      fileContents += `# Internal merge strategy: ${strategy.strategy.name || 'custom'}\n`;

      strategy.globs.forEach(glob => {
        fileContents += `${glob}\n`;
      });

      fileContents += '\n';
    });

    return fileContents.trimEnd() + '\n';
  };

  public static asDefinition = (fileContent: string): BlueprintOwnershipFileDefinition => {
    const lines = fileContent.split(/\r?\n/);

    const strategies: Strategy[] = [];
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trimStart().trimEnd();

      if (trimmedLine.length === 0 || trimmedLine.startsWith('#')) {
        return;
      }

      const strategy = this.parseSectionLine(trimmedLine);
      if (strategy) {
        strategies.push({
          identifier: strategy.identifier,
          owner: strategy.owner,
          strategy: MergeStrategies.neverUpdate, // TODO: look up proper merge strategy function
          globs: [],
        });
        return;
      }

      if (strategies.length === 0) {
        throw new BlueprintOwnershipFileSyntaxError('encountered unexpected glob outside of a strategy section', lineNumber);
      }
      const currentStrategy = strategies[strategies.length - 1];
      currentStrategy.globs.push(trimmedLine);
    });
    return {
      resynthesis: {
        strategies,
      },
    };
  };

  private static readonly strategyLineRegex = /^\[(?<identifier>.+)\]\s+(?<owner>.+)$/; // e.g. [my_identifier] @caws-blueprint/my-blueprint

  private static parseSectionLine(line: string): { identifier: string; owner: string } | undefined {
    const match = line.match(this.strategyLineRegex);
    if (!match || !match?.groups) {
      return;
    }

    const { identifier, owner } = match.groups;
    return { identifier, owner };
  }

  constructor(protected readonly sourceRepository: SourceRepository, options: BlueprintOwnershipFileDefinition) {
    super(
      sourceRepository,
      path.join(options.filePath ?? '', BLUEPRINT_OWNERSHIP_FILE),
      Buffer.from(BlueprintOwnershipFile.asString(sourceRepository.blueprint, options)),
    );
  }
}
