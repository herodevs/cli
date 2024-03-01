import { AggregateResult } from './aggregate-result';
import { TotalResult } from './total-result';

export interface CategoryResult {
  name: string;
  totals: TotalResult;
  fileTypes: AggregateResult[];
}
