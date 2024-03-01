import { Result } from './result';

export interface FileResult extends Result {
  fileType: string;
  path: string;
}
