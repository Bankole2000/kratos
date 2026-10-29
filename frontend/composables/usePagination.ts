interface PaginationOptions {
  initialPage?: number
  initialPageSize?: number
}

export const usePagination = <T>(
  fetcher: (page: number, pageSize: number) => Promise<{ items: T[]; total: number }>,
  options: PaginationOptions = {},
) => {
  const page = ref(options.initialPage ?? 1)
  const pageSize = ref(options.initialPageSize ?? 10)
  const items = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)
  const hasNext = computed(() => page.value < totalPages.value)
  const hasPrev = computed(() => page.value > 1)

  const fetch = async () => {
    loading.value = true
    error.value = null
    try {
      const result = await fetcher(page.value, pageSize.value)
      items.value = result.items
      total.value = result.total
    } catch (e: any) {
      error.value = e?.data?.message ?? e?.message ?? 'Failed to load data'
    } finally {
      loading.value = false
    }
  }

  const goToPage = (n: number) => {
    page.value = Math.max(1, Math.min(n, totalPages.value))
    fetch()
  }

  const nextPage = () => { if (hasNext.value) goToPage(page.value + 1) }
  const prevPage = () => { if (hasPrev.value) goToPage(page.value - 1) }

  const setPageSize = (size: number) => {
    pageSize.value = size
    page.value = 1
    fetch()
  }

  fetch()

  return { items, total, totalPages, page, pageSize, loading, error, hasNext, hasPrev, goToPage, nextPage, prevPage, setPageSize, refresh: fetch }
}
