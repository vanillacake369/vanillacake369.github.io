import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/vim/**'],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
      '@domain': '/src/domain',
      '@vim': '/src/vim',
      '@components': '/src/components',
      '@layouts': '/src/layouts',
    },
  },
});
