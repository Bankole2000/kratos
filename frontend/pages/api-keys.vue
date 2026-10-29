<script setup lang="ts">
import type { ApiKey, ApiKeyCreated, PaginatedResult, Project } from '~/types/resources'

useSeo({ title: 'API Keys' })

const { $api } = useNuxtApp()
const api = $api as typeof $fetch
const toast = useToast()
const { confirm } = useConfirm()

const items = ref<ApiKey[]>([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const itemsPerPage = 25

const projects = ref<Project[]>([])
const projectName = (id: string) => projects.value.find(p => p.id === id)?.name ?? '—'
onMounted(async () => {
  const result = await api<PaginatedResult<Project>>('/projects', { query: { limit: 200 } })
  projects.value = result.items
})

const headers = [
  { title: 'Project', key: 'projectId' },
  { title: 'Key Prefix', key: 'keyPrefix', width: '160' },
  { title: 'Rate Limit / min', key: 'rateLimitPerMin', width: '140' },
  { title: 'Last Used', key: 'lastUsedAt', width: '180' },
  { title: 'Status', key: 'status', width: '120' },
]

const load = async () => {
  loading.value = true
  try {
    const result = await api<PaginatedResult<ApiKey>>('/api-keys', {
      query: { limit: itemsPerPage, offset: (page.value - 1) * itemsPerPage },
    })
    items.value = result.items
    total.value = result.total
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    toast.error(err?.data?.message ?? err?.message ?? 'Failed to load API keys')
  } finally {
    loading.value = false
  }
}

watch(page, load)
onMounted(load)

const createDialog = ref(false)
const form = reactive<{ projectId: string | null; rateLimitPerMin: number }>({ projectId: null, rateLimitPerMin: 60 })
const revealDialog = ref(false)
const revealedKey = ref('')

const openCreate = () => {
  Object.assign(form, { projectId: null, rateLimitPerMin: 60 })
  createDialog.value = true
}

const createKey = async () => {
  try {
    const created = await api<ApiKeyCreated>('/api-keys', {
      method: 'POST',
      body: { projectId: form.projectId, rateLimitPerMin: form.rateLimitPerMin },
    })
    createDialog.value = false
    revealedKey.value = created.key
    revealDialog.value = true
    await load()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    toast.error(err?.data?.message ?? err?.message ?? 'Failed to create API key')
  }
}

const copyKey = async () => {
  await navigator.clipboard.writeText(revealedKey.value)
  toast.success('Copied to clipboard')
}

const revokeKey = async (item: ApiKey) => {
  if (!(await confirm({
    title: 'Revoke API key',
    message: `Revoke access for "${projectName(item.projectId)}"? Requests using this key will start failing immediately. This cannot be undone.`,
    color: 'error',
    confirmText: 'Revoke',
  }))) return
  try {
    await api(`/api-keys/${item.id}/revoke`, { method: 'POST' })
    toast.success('Revoked')
    await load()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    toast.error(err?.data?.message ?? err?.message ?? 'Failed to revoke')
  }
}
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h5 font-weight-bold">API Keys</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">New API Key</v-btn>
    </div>

    <v-data-table-server
      :headers="[...headers, { title: '', key: 'actions', sortable: false, width: '96' }]"
      :items="items"
      :items-length="total"
      :items-per-page="itemsPerPage"
      :loading="loading"
      :page="page"
      @update:page="page = $event"
    >
      <template #item.projectId="{ item }">{{ projectName(item.projectId) }}</template>
      <template #item.keyPrefix="{ item }">
        <code class="text-body-2">{{ item.keyPrefix }}…</code>
      </template>
      <template #item.lastUsedAt="{ item }">
        {{ item.lastUsedAt ? new Date(item.lastUsedAt).toLocaleString() : 'Never' }}
      </template>
      <template #item.status="{ item }">
        <v-chip v-if="item.revokedAt" size="small" color="error" variant="tonal">Revoked</v-chip>
        <v-chip v-else size="small" color="success" variant="tonal">Active</v-chip>
      </template>
      <template #item.actions="{ item }">
        <v-btn
          v-if="!item.revokedAt"
          icon="mdi-cancel"
          variant="text"
          size="small"
          color="error"
          @click="revokeKey(item)"
        />
      </template>
      <template #no-data>
        <CommonEmptyState icon="mdi-key-off-outline" title="No API keys" message="Issue one for a consuming project to authenticate with." />
      </template>
    </v-data-table-server>

    <v-dialog v-model="createDialog" max-width="420">
      <v-card rounded="lg">
        <v-card-title class="text-h6 pt-6 px-6">New API Key</v-card-title>
        <v-card-text class="px-6">
          <v-select
            v-model="form.projectId"
            :items="projects"
            item-title="name"
            item-value="id"
            label="Project"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />
          <v-text-field v-model.number="form.rateLimitPerMin" label="Rate Limit (per minute)" type="number" variant="outlined" density="comfortable" />
        </v-card-text>
        <v-card-actions class="pa-4 pt-2">
          <v-spacer />
          <v-btn variant="text" @click="createDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="tonal" :disabled="!form.projectId" @click="createKey">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="revealDialog" max-width="480" persistent>
      <v-card rounded="lg">
        <v-card-title class="text-h6 pt-6 px-6">API key created</v-card-title>
        <v-card-text class="px-6">
          <v-alert type="warning" variant="tonal" density="compact" class="mb-4">
            This is shown only once. Copy it now — it cannot be retrieved again.
          </v-alert>
          <v-text-field
            :model-value="revealedKey"
            readonly
            variant="outlined"
            density="comfortable"
            append-inner-icon="mdi-content-copy"
            @click:append-inner="copyKey"
          />
        </v-card-text>
        <v-card-actions class="pa-4 pt-2">
          <v-spacer />
          <v-btn color="primary" variant="tonal" @click="revealDialog = false">Done</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
