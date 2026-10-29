import { useUiStore } from '~/stores/ui'

export const useToast = () => {
  const ui = useUiStore()
  return {
    success: ui.success.bind(ui),
    error: ui.error.bind(ui),
    warning: ui.warning.bind(ui),
    info: ui.info.bind(ui),
    show: ui.toast.bind(ui),
    setLocation: ui.setToastLocation.bind(ui),
  }
}
