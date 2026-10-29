<script setup lang="ts">
import type { NotificationChannel, NotificationTemplate } from '~/types/resources'

useSeo({ title: 'Templates' })

const { items, total, loading, list, create, update, remove } = useResourceCrud<NotificationTemplate>('/templates')
const { confirm } = useConfirm()

const page = ref(1)
const itemsPerPage = 25

const headers = [
  { title: 'Key', key: 'key' },
  { title: 'Channel', key: 'channel', width: '120' },
  { title: 'Active', key: 'isActive', width: '100' },
  { title: 'Updated', key: 'updatedAt', width: '180' },
]

const load = () => list({ limit: itemsPerPage, offset: (page.value - 1) * itemsPerPage })
watch(page, load)
onMounted(load)

const channels: NotificationChannel[] = ['EMAIL', 'SMS', 'PUSH', 'IN_APP']

const editDialog = ref(false)
const editing = ref<NotificationTemplate | null>(null)
const form = reactive<{ key: string; channel: NotificationChannel; isActive: boolean; content: Record<string, string> }>({
  key: '',
  channel: 'EMAIL',
  isActive: true,
  content: {},
})

// Content shape differs per channel — email has subject/html/text, push/
// in-app have title/body/actionUrl. Labeled fields per channel are easier
// for an admin to fill in correctly than a raw JSON editor.
const contentFieldsByChannel: Record<NotificationChannel, { key: string; label: string; multiline?: boolean }[]> = {
  EMAIL: [
    { key: 'subject', label: 'Subject' },
    { key: 'html', label: 'HTML body', multiline: true },
    { key: 'text', label: 'Plain text body (optional)', multiline: true },
  ],
  SMS: [{ key: 'text', label: 'Message text', multiline: true }],
  PUSH: [
    { key: 'title', label: 'Title' },
    { key: 'body', label: 'Body', multiline: true },
    { key: 'actionUrl', label: 'Action URL (optional)' },
  ],
  IN_APP: [
    { key: 'title', label: 'Title' },
    { key: 'body', label: 'Body', multiline: true },
    { key: 'actionUrl', label: 'Action URL (optional)' },
  ],
}

const activeFields = computed(() => contentFieldsByChannel[form.channel])

const openCreate = () => {
  editing.value = null
  Object.assign(form, { key: '', channel: 'EMAIL', isActive: true, content: {} })
  editDialog.value = true
}

const openEdit = (item: NotificationTemplate) => {
  editing.value = item
  Object.assign(form, { key: item.key, channel: item.channel, isActive: item.isActive, content: { ...item.content } })
  editDialog.value = true
}

const save = async () => {
  const body = { key: form.key, channel: form.channel, isActive: form.isActive, content: form.content }
  if (editing.value) await update(editing.value.id, body)
  else await create(body)
  editDialog.value = false
  await load()
}

const onDelete = async (item: NotificationTemplate) => {
  if (!(await confirm({ title: 'Delete template', message: `Delete "${item.key}" (${item.channel})? This cannot be undone.`, color: 'error' }))) return
  await remove(item.id)
  await load()
}

const viewDialog = ref(false)
const viewing = ref<NotificationTemplate | null>(null)

const openView = (item: NotificationTemplate) => {
  viewing.value = item
  viewDialog.value = true
}

const viewFields = computed(() => viewing.value ? [
  { label: 'Key', value: viewing.value.key },
  { label: 'Channel', value: viewing.value.channel },
  { label: 'Active', value: viewing.value.isActive },
  ...contentFieldsByChannel[viewing.value.channel].map(f => ({ label: f.label, value: viewing.value!.content[f.key] })),
  { label: 'Updated', value: new Date(viewing.value.updatedAt).toLocaleString() },
] : [])
</script>

<template>
  <div>
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <div class="mr-auto">
        <h1 class="text-h5 font-weight-bold">Templates</h1>
        <p class="text-body-2 text-medium-emphasis">Global defaults, used when a project has no override.</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">New Template</v-btn>
    </div>

    <CommonResourceTable
      :headers="headers"
      :items="items"
      :loading="loading"
      :total="total"
      :page="page"
      :items-per-page="itemsPerPage"
      @update:page="page = $event"
      @view="openView"
      @update="openEdit"
      @delete="onDelete"
    >
      <template #item.isActive="{ item }">
        <v-chip size="small" :color="item.isActive ? 'success' : undefined" variant="tonal">{{ item.isActive ? 'Active' : 'Inactive' }}</v-chip>
      </template>
      <template #item.updatedAt="{ item }">{{ new Date(item.updatedAt).toLocaleString() }}</template>
    </CommonResourceTable>

    <CommonRecordViewDialog
      v-model="viewDialog"
      title="Template Details"
      :fields="viewFields"
    />

    <v-dialog v-model="editDialog" max-width="560">
      <v-card rounded="lg">
        <v-card-title class="text-h6 pt-6 px-6">{{ editing ? 'Edit Template' : 'New Template' }}</v-card-title>
        <v-card-text class="px-6">
          <v-text-field v-model="form.key" label="Key" hint="e.g. email.verification" persistent-hint variant="outlined" density="comfortable" class="mb-2" />
          <v-select
            v-model="form.channel"
            :items="channels"
            label="Channel"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />
          <v-switch v-model="form.isActive" label="Active" color="primary" density="compact" class="mb-2" />
          <template v-for="field in activeFields" :key="field.key">
            <v-textarea
              v-if="field.multiline"
              v-model="form.content[field.key]"
              :label="field.label"
              variant="outlined"
              density="comfortable"
              rows="3"
              class="mb-2"
            />
            <v-text-field
              v-else
              v-model="form.content[field.key]"
              :label="field.label"
              variant="outlined"
              density="comfortable"
              class="mb-2"
            />
          </template>
        </v-card-text>
        <v-card-actions class="pa-4 pt-2">
          <v-spacer />
          <v-btn variant="text" @click="editDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="tonal" @click="save">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
