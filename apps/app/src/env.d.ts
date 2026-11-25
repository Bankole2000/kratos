/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Root URL of the api, without a trailing slash. Public: it ships to users. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
