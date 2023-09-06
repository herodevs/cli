const path = require('path');
const packageJsonPath = path.join(__dirname, '../../../package.json');
const packageJson = require(packageJsonPath);

export const env = {
    packageVersion: packageJson.version as string,
    packageName: packageJson.name as string,
}
