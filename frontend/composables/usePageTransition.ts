export type TransitionName = 'fade' | 'slide' | 'fade-slide' | 'none'

const current = ref<TransitionName>('fade-slide')

export const usePageTransition = () => {
  const setTransition = (name: TransitionName) => {
    current.value = name
  }

  const transition = computed(() => {
    if (current.value === 'none') return false
    return { name: `page-${current.value}`, mode: 'out-in' as const }
  })

  return { transition, currentTransition: current, setTransition }
}
