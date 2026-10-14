import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const DATA_DIR = join(import.meta.dirname, 'public', 'data');

const FILE_NAME_PATTERN = /^statistics_(\d{4}-\d{2}-\d{2})\.json$/;

function readDates(warn: (message: string) => void): string[] {
  const entries = readdirSync(DATA_DIR);

  for (const entry of entries) {
    if (/statistics/i.test(entry) && !FILE_NAME_PATTERN.test(entry)) {
      warn(`public/data/${entry} — имя не подходит под statistics_YYYY-MM-DD.json, файл пропущен`);
    }
  }

  return entries
    .map((entry) => FILE_NAME_PATTERN.exec(entry)?.[1])
    .filter((date) => date !== undefined)
    .sort()
    .reverse();
}

function dataIndex(): Plugin {
  let base = '/';

  return {
    name: 'data-index',

    configResolved(config) {
      base = config.base;
    },

    configureServer(server) {
      const indexPath = `${base}data/index.json`;

      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== indexPath) {
          next();

          return;
        }

        const dates = readDates((message) => server.config.logger.warn(message));

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify({ dates }));
      });
    },

    writeBundle(options) {
      const dates = readDates((message) => this.warn(message));

      writeFileSync(join(options.dir ?? 'dist', 'data', 'index.json'), JSON.stringify({ dates }));
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_API_PROXY_TARGET } = loadEnv(mode, import.meta.dirname);

  return {
    /* Прод-хост отдаёт приложение из корня. GitHub/GitLab Pages — из подпапки, её задаёт BASE_PATH в CI. */
    base: process.env.BASE_PATH ?? '/',
    plugins: [react(), dataIndex()],
    server: {
      /* dev: /api уходит на бэкенд через vite, без CORS. В проде origin задаёт VITE_API_BASE_URL. */
      proxy: VITE_API_PROXY_TARGET ? { '/api': { target: VITE_API_PROXY_TARGET, changeOrigin: true } } : undefined,
    },
  };
});
