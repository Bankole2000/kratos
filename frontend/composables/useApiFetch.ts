export const useApiFetch = <T>(path: string, options: Parameters<typeof $fetch<T>>[1] = {}) => {
  const { $api } = useNuxtApp()
  return ($api as typeof $fetch)<T>(path, options)
}
