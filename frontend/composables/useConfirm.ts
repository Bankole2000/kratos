interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  color?: string
}

interface ConfirmState {
  open: boolean
  options: ConfirmOptions
  resolve: ((value: boolean) => void) | null
}

const state = reactive<ConfirmState>({
  open: false,
  options: { message: '' },
  resolve: null,
})

export const useConfirm = () => {
  const confirm = (options: ConfirmOptions | string): Promise<boolean> => {
    state.options = typeof options === 'string' ? { message: options } : options
    state.open = true
    return new Promise((resolve) => {
      state.resolve = resolve
    })
  }

  const _accept = () => {
    state.open = false
    state.resolve?.(true)
    state.resolve = null
  }

  const _cancel = () => {
    state.open = false
    state.resolve?.(false)
    state.resolve = null
  }

  return {
    confirm,
    _state: readonly(state),
    _accept,
    _cancel,
  }
}
