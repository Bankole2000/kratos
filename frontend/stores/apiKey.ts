import { defineStore } from 'pinia'

interface ApiKeyState {
  key: string | null
}

export const useApiKeyStore = defineStore('apiKey', {
  state: (): ApiKeyState => ({
    key: null,
  }),

  getters: {
    isSet: (state) => !!state.key,
  },

  actions: {
    hydrate() {
      if (import.meta.client) this.key = localStorage.getItem('crs:apiKey')
    },

    setKey(key: string) {
      this.key = key
      if (import.meta.client) localStorage.setItem('crs:apiKey', key)
    },

    clearKey() {
      this.key = null
      if (import.meta.client) localStorage.removeItem('crs:apiKey')
    },
  },
})
