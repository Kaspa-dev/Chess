import {defineConfig} from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      reporter: ['text'],
      exclude: [
        '**/node_modules/**',
        '**/tests/**',
        '**/*.test.ts',
        'src/pages/blog.tsx',
        'src/pages/docs.tsx',
        'src/pages/index.tsx',
        'src/pages/pricing.tsx',
        'src/pages/about.tsx',
        'src/static/PasswordEye.tsx',
        'src/main.tsx',
        'src/App.tsx',
        'src/components/icons.tsx',
        'src/components/primitives.ts',
        'src/components/theme-switch.tsx',
        'src/config/chessSite.ts',
        'src/config/site.ts',
        'src/types/index.ts'
      ],
      all: true,
      include: ['src/**/*.{ts,tsx}'],
    },
  }
});