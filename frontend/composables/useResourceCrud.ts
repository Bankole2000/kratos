import type { PaginatedResult, Tag } from '~/types/resources'

interface ListParams {
  limit?: number
  offset?: number
  [key: string]: string | number | undefined
}

export const useResourceCrud = <T extends { id: string }>(basePath: string) => {
  const { $api } = useNuxtApp()
  const api = $api as typeof $fetch
  const toast = useToast()

  const items = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)
  const loading = ref(false)

  const list = async (params: ListParams = {}) => {
    loading.value = true
    try {
      const query = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
      )
      const result = await api<PaginatedResult<T>>(basePath, { query })
      items.value = result.items
      total.value = result.total
      return result
    } catch (e: unknown) {
      const err = e as { data?: { message?: string }; message?: string }
      toast.error(err?.data?.message ?? err?.message ?? 'Failed to load data')
      throw e
    } finally {
      loading.value = false
    }
  }

  const create = async (body: Record<string, unknown>) => {
    try {
      const created = await api<T>(basePath, { method: 'POST', body })
      toast.success('Created')
      return created
    } catch (e: unknown) {
      const err = e as { data?: { message?: string }; message?: string }
      toast.error(err?.data?.message ?? err?.message ?? 'Create failed')
      throw e
    }
  }

  const update = async (id: string, body: Record<string, unknown>) => {
    try {
      const updated = await api<T>(`${basePath}/${id}`, { method: 'PATCH', body })
      toast.success('Saved')
      return updated
    } catch (e: unknown) {
      const err = e as { data?: { message?: string }; message?: string }
      toast.error(err?.data?.message ?? err?.message ?? 'Save failed')
      throw e
    }
  }

  const remove = async (id: string) => {
    try {
      await api(`${basePath}/${id}`, { method: 'DELETE' })
      toast.success('Deleted')
    } catch (e: unknown) {
      const err = e as { data?: { message?: string }; message?: string }
      toast.error(err?.data?.message ?? err?.message ?? 'Delete failed')
      throw e
    }
  }

  return { items, total, loading, list, create, update, remove }
}

export const useTagAssignments = (basePath: string, entityId: Ref<string | undefined>) => {
  const { $api } = useNuxtApp()
  const api = $api as typeof $fetch
  const toast = useToast()

  const tags = ref<Tag[]>([])
  const loading = ref(false)

  const load = async () => {
    if (!entityId.value) return
    loading.value = true
    try {
      tags.value = await api<Tag[]>(`${basePath}/${entityId.value}/tags`)
    } finally {
      loading.value = false
    }
  }

  const attach = async (input: { tagId?: string; name?: string }) => {
    if (!entityId.value) return
    try {
      await api(`${basePath}/${entityId.value}/tags`, { method: 'POST', body: input })
      await load()
    } catch (e: unknown) {
      const err = e as { data?: { message?: string }; message?: string }
      toast.error(err?.data?.message ?? err?.message ?? 'Failed to attach tag')
      throw e
    }
  }

  const detach = async (tagId: string) => {
    if (!entityId.value) return
    try {
      await api(`${basePath}/${entityId.value}/tags/${tagId}`, { method: 'DELETE' })
      await load()
    } catch (e: unknown) {
      const err = e as { data?: { message?: string }; message?: string }
      toast.error(err?.data?.message ?? err?.message ?? 'Failed to detach tag')
      throw e
    }
  }

  return { tags, loading, load, attach, detach }
}
