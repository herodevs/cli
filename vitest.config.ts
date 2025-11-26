import { defineConfig } from 'vitest/config';

const inlineDeps = ['@herodevs/eol-shared', 'update-notifier', '@apollo/client'];

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts', 'test/**/*.jest.ts'],
    setupFiles: 'test/vitest.setup.ts',
    server: {
      deps: {
        inline: inlineDeps,
      },
    },
  },
});
