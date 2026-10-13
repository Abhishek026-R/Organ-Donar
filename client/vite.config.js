import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export default defineConfig({
  root: projectRoot,
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:5000' } },
  build: { outDir: path.join(projectRoot, 'client', 'dist'), emptyOutDir: true }
});
