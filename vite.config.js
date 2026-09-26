import { defineConfig } from 'vite';
import { resolveBase } from './build/base.js';

export default defineConfig({
  base: resolveBase(process.env.BASE_PATH),
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
  },
});
