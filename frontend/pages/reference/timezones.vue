<script setup lang="ts">
import type { Timezone } from '~/types/resources'

useSeo({ title: 'Timezones' })

const { items, total, loading, list, create, update, remove } = useResourceCrud<Timezone>('/timezones')
const { confirm } = useConfirm()

const page = ref(1)
const itemsPerPage = 25
const search = ref('')

const headers = [
  { title: 'Identifier', key: 'identifier' },
  { title: 'UTC Offset', key: 'utcOffset', width: '140' },
  { title: 'Display Name', key: 'displayName' },
]

const load = () => list({
  limit: itemsPerPage,
  offset: (page.value - 1) * itemsPerPage,
  search: search.value || undefined,
})

watch(page, load)
watch(search, () => { page.value = 1; load() })
onMounted(load)

const editDialog = ref(false)
const editing = ref<Timezone | null>(null)
const form = reactive({ identifier: '', utcOffset: '', displayName: '', metadata: null as Record<string, unknown> | null })

const openCreate = () => {
  editing.value = null
  Object.assign(form, { identifier: '', utcOffset: '', displayName: '', metadata: null })
  editDialog.value = true
}

const openEdit = (item: Timezone) => {
  editing.value = item
  Object.assign(form, { identifier: item.identifier, utcOffset: item.utcOffset, displayName: item.displayName, metadata: item.metadata })
  editDialog.value = true
}

const save = async () => {
  const body = { ...form }
  if (editing.value) await update(editing.value.id, body)
  else await create(body)
  editDialog.value = false
  await load()
}

const onDelete = async (item: Timezone) => {
  if (!(await confirm({ title: 'Delete timezone', message: `Delete "${item.identifier}"? This cannot be undone.`, color: 'error' }))) return
  await remove(item.id)
  await load()
}

const viewDialog = ref(false)
const viewing = ref<Timezone | null>(null)

const openView = (item: Timezone) => {
  viewing.value = item
  viewDialog.value = true
}

const viewFields = computed(() => viewing.value ? [
  { label: 'Identifier', value: viewing.value.identifier },
  { label: 'UTC Offset', value: viewing.value.utcOffset },
  { label: 'Display Name', value: viewing.value.displayName },
  { label: 'Created', value: new Date(viewing.value.createdAt).toLocaleString() },
  { label: 'Updated', value: new Date(viewing.value.updatedAt).toLocaleString() },
] : [])
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h5 font-weight-bold">Timezones</h1>
      <v-spacer />
      <v-text-field
        v-model="search"
        placeholder="Search by identifier"
        prepend-inner-icon="mdi-magnify"
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 280px;"
        class="mr-3"
      />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">New Timezone</v-btn>
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
    />

    <CommonRecordViewDialog
      v-model="viewDialog"
      title="Timezone Details"
      :fields="viewFields"
      :metadata="viewing?.metadata"
    />

    <v-dialog v-model="editDialog" max-width="420">
      <v-card rounded="lg">
        <v-card-title class="text-h6 pt-6 px-6">{{ editing ? 'Edit Timezone' : 'New Timezone' }}</v-card-title>
        <v-card-text class="px-6">
          <v-text-field v-model="form.identifier" label="Identifier (IANA)" variant="outlined" density="comfortable" class="mb-2" />
          <v-text-field v-model="form.utcOffset" label="UTC Offset" variant="outlined" density="comfortable" class="mb-2" />
          <v-text-field v-model="form.displayName" label="Display Name" variant="outlined" density="comfortable" class="mb-2" />
          <CommonMetadataEditor v-model="form.metadata" />
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
