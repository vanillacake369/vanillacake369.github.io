import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/usecases/**', 'src/infrastructure/**'],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
      '@domain': '/src/domain',
      '@usecases': '/src/usecases',
      '@infra': '/src/infrastructure',
      '@components': '/src/components',
      '@layouts': '/src/layouts',
    },
  },
});
