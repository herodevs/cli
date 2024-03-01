import { CategoryResult } from './category-result';

export interface ProcessResult {
  timestamp: string;
  hash: string;
  categories: CategoryResult[];
}
