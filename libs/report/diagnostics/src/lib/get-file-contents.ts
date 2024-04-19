import { existsSync, readFileSync } from 'fs';

export function getFileContents(filePath: string): string {
  if (!existsSync(filePath)) {
    return `${filePath} not found`;
  }
  const diagData = readFileSync(filePath, 'utf8');
  return diagData;
}
