import { CategoryDefinition } from './category';

export interface Config {
  categories: { [key: string]: CategoryDefinition };
  ignorePatterns?: string[];
  outputDir: string;
}
