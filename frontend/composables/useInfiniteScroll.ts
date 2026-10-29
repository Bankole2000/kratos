interface InfiniteScrollOptions {
  pageSize?: number
  rootMargin?: string
}

export const useInfiniteScroll = <T>(
  fetcher: (page: number, pageSize: number) => Promise<{ items: T[]; total: number }>,
  options: InfiniteScrollOptions = {},
) => {
  const pageSize = options.pageSize ?? 10
  const rootMargin = options.rootMargin ?? '200px'

  const items = ref<T[]>([]) as Ref<T[]>
  const page = ref(0)
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const hasMore = computed(() => items.value.length < total.value)

  const loadMore = async () => {
    if (loading.value || !hasMore.value) return
    loading.value = true
    error.value = null
    try {
      const next = page.value + 1
      const result = await fetcher(next, pageSize)
      items.value = [...items.value, ...result.items]
      total.value = result.total
      page.value = next
    } catch (e: any) {
      error.value = e?.data?.message ?? e?.message ?? 'Failed to load more'
    } finally {
      loading.value = false
    }
  }

  const reset = () => {
    items.value = []
    page.value = 0
    total.value = 0
    error.value = null
    loadMore()
  }

  // Sentinel element ref — mount this at the bottom of the list
  const sentinel = ref<HTMLElement | null>(null)
  let observer: IntersectionObserver | null = null

  const observe = () => {
    if (!sentinel.value) return
    observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) loadMore() },
      { rootMargin },
    )
    observer.observe(sentinel.value)
  }

  onMounted(() => { loadMore() })

  watch(sentinel, (el) => {
    observer?.disconnect()
    if (el) observe()
  })

  onUnmounted(() => observer?.disconnect())

  return { items, total, page, loading, error, hasMore, sentinel, loadMore, reset }
}
