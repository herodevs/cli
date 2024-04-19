export function getDiagnosticTypes() {
  const diagTypeList = [
    { name: 'Package JSON - dependencies', value: 'dependencies' },
    { name: 'Package JSON - devDependencies', value: 'devDependencies' },
    { name: 'Package JSON - overrides', value: 'overrides' },
    { name: '.npmrc file contents', value: 'npmrc' },
    { name: 'npm config', value: 'npm config' },
    { name: 'List of installed packages (npm ls)', value: 'npm ls' },
  ];
  return diagTypeList;
}
