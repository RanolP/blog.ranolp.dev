import { unstable_reactRouterRSC as reactRouterRsc } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import rsc from '@vitejs/plugin-rsc';

export default defineConfig({
  plugins: [tailwindcss(), reactRouterRsc(), rsc(), tsconfigPaths()],
  optimizeDeps: {
    include: ['react-router/dom', 'react-tweet'],
  },
  ssr: {
    // Bundle react-tweet instead of treating it as external
    // This ensures CSS modules are properly processed
    noExternal: ['react-tweet'],
  },
});
