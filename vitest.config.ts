import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      cc: resolve(__dirname, 'tests/mocks/cc.ts')
    }
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts']
  }
});
