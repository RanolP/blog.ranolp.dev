import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter().filter(
      (x) =>
        // because react-tweet exposes index.client.js, which can be used on both side.
        x.name !== 'react-router:dot-client',
    ),
    tsconfigPaths(),
  ],
  optimizeDeps: {
    include: ['react-router/dom'],
  },
  ssr: {
    noExternal: ['react-tweet'],
  },
});
