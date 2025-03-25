import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createBom } from '@cyclonedx/cdxgen';
import { SBOM_DEFAULT__OPTIONS } from './cdx.svc.ts';

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

try {
  console.log('Sbom worker started');
  const options = JSON.parse(process.argv[2]);
  const { path, opts } = options;
  const { bomJson } = await createBom(path, { ...SBOM_DEFAULT__OPTIONS, ...opts });
  const outputPath = join(path, 'nes.sbom.json');
  writeFileSync(outputPath, JSON.stringify(bomJson, null, 2));
  process.exit(0);
} catch (error: unknown) {
  console.error('Error creating SBOM', (error as Error).message);
  process.exit(1);
}
