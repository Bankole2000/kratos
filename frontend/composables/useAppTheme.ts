import { useTheme } from 'vuetify'
import { useLocalStorage, usePreferredDark } from '@vueuse/core'

const systemPrefersDark = usePreferredDark()

export const useAppTheme = () => {
  const vuetifyTheme = useTheme()
  const stored = useLocalStorage<'light' | 'dark' | 'system'>('app:theme', 'system')

  const resolved = computed<'light' | 'dark'>(() => {
    if (stored.value === 'system') return systemPrefersDark.value ? 'dark' : 'light'
    return stored.value
  })

  watch(resolved, (v) => vuetifyTheme.change(v), { immediate: true })

  const toggleTheme = () => {
    stored.value = resolved.value === 'light' ? 'dark' : 'light'
  }

  return { theme: resolved, toggleTheme, stored }
}
