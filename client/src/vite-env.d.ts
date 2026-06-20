/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the Better Auth server, e.g. http://localhost:3000 */
  readonly VITE_AUTH_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
