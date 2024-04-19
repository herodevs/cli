import { getFileContents } from './get-file-contents';

export function getPackageJsonSection(
  section: 'dependencies' | 'devDependencies' | 'overrides'
): string {
  const filePath = 'package.json';
  const pkg = JSON.parse(getFileContents(filePath));
  const sectionData = pkg[section];
  if (!sectionData) {
    return `${section} not found in package.json`;
  }
  const diagData = JSON.stringify(sectionData, null, 2);
  return diagData;
}
