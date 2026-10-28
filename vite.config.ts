import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    // Phaser alone is ~1.2 MB minified; splitting it is not worth it for the prototype.
    chunkSizeWarningLimit: 2000,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
