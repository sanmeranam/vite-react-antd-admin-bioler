/* eslint-disable no-undef */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '.env') });



// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'src/client'),
  build: {
    outDir: resolve(__dirname, 'src/server/public'),
    emptyOutDir: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.SERVER_PORT || 5000}`,
        changeOrigin: true,
      },
      [process.env.VITE_REPORT_API_URL]: {
        target: `http://localhost:${process.env.SERVER_PORT || 5000}`,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: [
      {
        find: /^~.+/,
        replacement: (val) => {
          return val.replace(/^~/, "");
        },
      },
    ],
  },
})
