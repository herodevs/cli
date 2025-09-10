import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from '../package.json' with { type: 'json' };

const newVersion = pkg.version;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readmePath = path.join(__dirname, '../README.md');
const installScriptPath = path.join(__dirname, './install.sh');

let readme = fs.readFileSync(readmePath, 'utf8');
let installScript = fs.readFileSync(installScriptPath, 'utf8');

// Regex to match version string inside /cli/v{{version}}/scripts/
const versionInInstallReadme = /(\/cli\/)v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(\/scripts\/)/g;

// Regex to match the LATEST_VERSION defined in the install.sh script
const versionInInstallScript = /(LATEST_VERSION=")v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(")/g;

readme = readme.replace(versionInInstallReadme, `$1v${newVersion}$2`);
fs.writeFileSync(readmePath, readme);

installScript = installScript.replace(versionInInstallScript, `$1v${newVersion}$2`);
fs.writeFileSync(installScriptPath, installScript);

console.log(`Updated install script and install command with ${newVersion}`);
