#!/usr/bin/env node

const oclif = await import('@oclif/core');
await oclif.execute({ dir: import.meta.dirname });
