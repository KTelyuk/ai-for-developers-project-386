import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: { NODE_ENV: 'test' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // Точка входа только слушает порт; всё остальное собирается через buildApp. Типы из контракта сгенерированы.
      exclude: ['src/server.ts', 'src/api/**'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
