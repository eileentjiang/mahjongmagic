import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from https://<user>.github.io/mahjongmagic/ on GitHub Pages.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: { environment: 'node' },
});
