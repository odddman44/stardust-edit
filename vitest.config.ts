import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/editor/tests/**/*.test.{ts,tsx}'],
    environment: 'node'
  }
});
