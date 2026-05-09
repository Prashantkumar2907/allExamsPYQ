import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    modulePreload: {
      resolveDependencies(_url, deps) {
        return deps.filter((dep) => !dep.includes('charts-'));
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/');
          if (normalizedId.includes('commonjsHelpers')) return 'vendor-helpers';
          if (normalizedId.includes('/node_modules/tslib/')) return 'vendor-helpers';
          if (
            normalizedId.includes('/src/components/ui/Button.tsx') ||
            normalizedId.includes('/src/lib/constants.ts') ||
            normalizedId.includes('/src/lib/utils.ts') ||
            normalizedId.includes('/src/stores/themeStore.ts')
          ) return 'ui-core';
          if (!normalizedId.includes('/node_modules/')) return undefined;
          if (
            normalizedId.includes('/node_modules/clsx/') ||
            normalizedId.includes('/node_modules/tailwind-merge/') ||
            normalizedId.includes('/node_modules/class-variance-authority/') ||
            normalizedId.includes('/node_modules/zustand/')
          ) return 'ui-core';
          if (
            normalizedId.includes('/node_modules/recharts/') ||
            /\/node_modules\/d3-[^/]+\//.test(normalizedId)
          ) return 'charts';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('@radix-ui')) return 'radix-ui';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'react';
          return undefined;
        },
      },
    },
  },
});
