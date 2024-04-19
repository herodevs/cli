export interface Category extends CategoryDefinition {
  name: string;
}

export interface CategoryDefinition {
  fileTypes: string[];
  includes: string[];
  excludes?: string[];
  jsTsPairs?: 'js' | 'ts' | 'ignore';
}
