#!/usr/bin/env node

process.env.GRAPHQL_HOST = 'http://localhost:3000';

async function run() {
  const oclif = await import('@oclif/core');
  await oclif.execute({ development: true, dir: import.meta.dirname });
  console.log('\n\n\n=> OCLIF: Command complete.');
}

run();
