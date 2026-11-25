import { createPlatformUi } from 'ui'

// Installs packages/ui (Vuetify, theme and the api client) into the Nuxt app. The api base URL
// comes from public runtime config only (NUXT_PUBLIC_API_BASE_URL).
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  nuxtApp.vueApp.use(createPlatformUi({ apiBaseUrl: config.public.apiBaseUrl, ssr: true }))
})
