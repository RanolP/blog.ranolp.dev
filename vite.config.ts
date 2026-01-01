import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  optimizeDeps: {
    include: ['react-tweet'],
  },
  ssr: {
    // Bundle react-tweet instead of treating it as external
    // This ensures CSS modules are properly processed
    noExternal: ['react-tweet'],
  },
});
