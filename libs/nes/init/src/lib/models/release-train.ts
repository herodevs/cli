import { Entry } from './entry';
import { Product } from './product';

export interface ReleaseTrain {
  id?: number;
  key: string;
  name: string;
  products: Product[];
  entries: Entry[];
}
