import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'node:child_process';

const buildDate = new Date().toISOString().slice(0, 10);
let buildSha = 'untracked';
try {
  buildSha = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  // not in a git repo or no commits yet
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    __BUILD_DATE__: JSON.stringify(buildDate),
    __BUILD_SHA__: JSON.stringify(buildSha),
  },
  build: {
    outDir: 'dist',
  },
});
