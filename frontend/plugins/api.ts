import { useApiKeyStore } from '~/stores/apiKey'
import { useUiStore } from '~/stores/ui'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const apiKeyStore = useApiKeyStore()
  const ui = useUiStore()

  const $api = $fetch.create({
    baseURL: config.public.apiBaseUrl,

    onRequest({ options }) {
      if (apiKeyStore.key) {
        const headers = new Headers(options.headers as HeadersInit | undefined)
        headers.set('x-api-key', apiKeyStore.key)
        options.headers = headers
      }
    },

    onResponseError({ response }) {
      if (response.status === 401) {
        ui.error('API key is missing, invalid, or revoked.')
      }
      else if (response.status >= 500) {
        ui.error('A server error occurred. Please try again later.')
      }
    },
  })

  return {
    provide: { api: $api },
  }
})
