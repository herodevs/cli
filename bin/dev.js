#!/usr/bin/env node

import { execute } from '@oclif/core';

process.env.GRAPHQL_HOST = 'http://localhost:3000';

await execute({ development: true, dir: import.meta.url });
