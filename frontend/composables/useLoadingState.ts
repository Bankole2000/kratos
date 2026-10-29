import { useUiStore } from '~/stores/ui'

export const useLoadingState = () => {
  const ui = useUiStore()
  return {
    start: ui.startLoading.bind(ui),
    stop: ui.stopLoading.bind(ui),
    isLoading: computed(() => ui.loading),
  }
}
