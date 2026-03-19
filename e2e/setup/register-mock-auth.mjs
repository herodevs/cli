import { register } from 'node:module';

process.env.TRACKING_OPT_OUT = 'true';
register('./mock-auth-hooks.mjs', import.meta.url);
