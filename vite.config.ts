import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Every build gets an id. The app compares its own id with version.json on the site to spot a newer release.
const BUILD_ID = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);

const versionFile = (): Plugin => ({
  name: 'version-file',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD_ID }) });
  },
});

// Served from https://<user>.github.io/mahjongmagic/ on GitHub Pages.
export default defineConfig({
  base: './',
  plugins: [react(), versionFile()],
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
});
