import { useApiKeyStore } from '~/stores/apiKey'

export default defineNuxtPlugin(() => {
  useApiKeyStore().hydrate()
})
