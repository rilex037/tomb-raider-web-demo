import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  server: {
    hmr: {
      port: 4200,
    },
  },
});
