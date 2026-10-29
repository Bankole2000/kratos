interface UseApiReturn<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  execute: (...args: any[]) => Promise<T | undefined>
  reset: () => void
}

export const useApi = <T>(
  fn: (...args: any[]) => Promise<T>,
  options: { immediate?: boolean; initialData?: T } = {},
): UseApiReturn<T> => {
  const data = ref<T | null>(options.initialData ?? null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<string | null>(null)

  const execute = async (...args: any[]): Promise<T | undefined> => {
    loading.value = true
    error.value = null
    try {
      data.value = await fn(...args)
      return data.value as T
    } catch (e: any) {
      error.value = e?.data?.message ?? e?.message ?? 'An error occurred'
      return undefined
    } finally {
      loading.value = false
    }
  }

  const reset = () => {
    data.value = options.initialData ?? null
    loading.value = false
    error.value = null
  }

  if (options.immediate) {
    execute()
  }

  return { data, loading, error, execute, reset }
}
