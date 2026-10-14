/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin бэкенда для прода. Пусто — запросы идут относительно текущего origin (/api/...). */
  readonly VITE_API_BASE_URL?: string;
  /** Куда vite dev server проксирует /api. Используется только в vite.config.ts. */
  readonly VITE_API_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
