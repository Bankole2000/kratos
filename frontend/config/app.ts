/**
 * Typed application config helpers.
 * Import from here instead of calling useRuntimeConfig() directly throughout the app —
 * keeps usages refactorable from one place and adds type safety.
 */

export interface AppConfig {
  apiBaseUrl: string
  isDev: boolean
}

export const useAppConfig = (): AppConfig => {
  const config = useRuntimeConfig()
  return {
    apiBaseUrl: config.public.apiBaseUrl as string,
    isDev: config.public.isDev as boolean,
  }
}

/** Feature flags — driven by env vars so they can differ per environment */
export const useFeatureFlags = () => {
  const { isDev } = useAppConfig()
  return {
    devToolsEnabled: isDev,
  }
}
