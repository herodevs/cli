import fs from 'node:fs';

const readmePath = 'README.md';
const readme = fs.readFileSync(readmePath, 'utf8');

const updated = readme

  // fix some bad URL references in OCLIF
  .replace(/\/plugin-help\/blob\/v/g, '/plugin-help/blob/')
  .replace(/\/plugin-update\/blob\/v/g, '/plugin-update/blob/')

  // OCLIF generated commands section always renders with H2, this makes them H3 to be excluded from ToC
  .replace(/<!-- commands -->[\s\S]*?<!-- commandsstop -->/, (match) => match.replace(/^## `/gm, '### `'));

fs.writeFileSync(readmePath, updated);
console.log('OCLIF README items updated');
