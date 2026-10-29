import { defineStore } from 'pinia'
import type { SnackbarQueueMessage as SnackbarMessage } from 'vuetify'

type ToastLocation = 'bottom center' | 'bottom end' | 'bottom start' | 'top center' | 'top end' | 'top start'

interface UiState {
  toasts: SnackbarMessage[]
  toastLocation: ToastLocation
  loading: boolean
  overlayMessage: string
}

export const useUiStore = defineStore('ui', {
  state: (): UiState => ({
    toasts: [],
    toastLocation: 'bottom end',
    loading: false,
    overlayMessage: '',
  }),

  actions: {
    toast(message: SnackbarMessage) {
      this.toasts = [...this.toasts, message]
    },

    success(text: string, timeout = 4000) {
      this.toast({ text, color: 'success', prependIcon: 'mdi-check-circle-outline', timeout, timer: 'bottom' })
    },

    error(text: string, timeout = 6000) {
      this.toast({ text, color: 'error', prependIcon: 'mdi-alert-circle-outline', timeout, timer: 'bottom', reverseTimer: true })
    },

    warning(text: string, timeout = 5000) {
      this.toast({ text, color: 'warning', prependIcon: 'mdi-alert-outline', timeout, timer: 'bottom' })
    },

    info(text: string, timeout = 4000) {
      this.toast({ text, color: 'info', prependIcon: 'mdi-information-outline', timeout, timer: 'bottom' })
    },

    setToastLocation(location: ToastLocation) {
      this.toastLocation = location
    },

    startLoading(message = '') {
      this.overlayMessage = message
      this.loading = true
    },

    stopLoading() {
      this.loading = false
      this.overlayMessage = ''
    },
  },
})
