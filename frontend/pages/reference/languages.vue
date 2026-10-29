<script setup lang="ts">
import type { Language } from '~/types/resources'

useSeo({ title: 'Languages' })

const { items, total, loading, list, create, update, remove } = useResourceCrud<Language>('/languages')
const { confirm } = useConfirm()

const page = ref(1)
const itemsPerPage = 25
const search = ref('')

const headers = [
  { title: 'Code', key: 'code', width: '100' },
  { title: 'Name', key: 'name' },
  { title: 'Native Name', key: 'nativeName' },
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
const editing = ref<Language | null>(null)
const form = reactive({ code: '', name: '', nativeName: '', metadata: null as Record<string, unknown> | null })

const openCreate = () => {
  editing.value = null
  Object.assign(form, { code: '', name: '', nativeName: '', metadata: null })
  editDialog.value = true
}

const openEdit = (item: Language) => {
  editing.value = item
  Object.assign(form, { code: item.code, name: item.name, nativeName: item.nativeName, metadata: item.metadata })
  editDialog.value = true
}

const save = async () => {
  const body = { ...form }
  if (editing.value) await update(editing.value.id, body)
  else await create(body)
  editDialog.value = false
  await load()
}

const onDelete = async (item: Language) => {
  if (!(await confirm({ title: 'Delete language', message: `Delete "${item.name}"? This cannot be undone.`, color: 'error' }))) return
  await remove(item.id)
  await load()
}

const viewDialog = ref(false)
const viewing = ref<Language | null>(null)

const openView = (item: Language) => {
  viewing.value = item
  viewDialog.value = true
}

const viewFields = computed(() => viewing.value ? [
  { label: 'Code', value: viewing.value.code },
  { label: 'Name', value: viewing.value.name },
  { label: 'Native Name', value: viewing.value.nativeName },
  { label: 'Created', value: new Date(viewing.value.createdAt).toLocaleString() },
  { label: 'Updated', value: new Date(viewing.value.updatedAt).toLocaleString() },
] : [])
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h5 font-weight-bold">Languages</h1>
      <v-spacer />
      <v-text-field
        v-model="search"
        placeholder="Search by name"
        prepend-inner-icon="mdi-magnify"
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 280px;"
        class="mr-3"
      />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">New Language</v-btn>
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
      title="Language Details"
      :fields="viewFields"
      :metadata="viewing?.metadata"
    />

    <v-dialog v-model="editDialog" max-width="420">
      <v-card rounded="lg">
        <v-card-title class="text-h6 pt-6 px-6">{{ editing ? 'Edit Language' : 'New Language' }}</v-card-title>
        <v-card-text class="px-6">
          <v-text-field v-model="form.code" label="Code (ISO 639-1)" maxlength="2" variant="outlined" density="comfortable" class="mb-2" />
          <v-text-field v-model="form.name" label="Name" variant="outlined" density="comfortable" class="mb-2" />
          <v-text-field v-model="form.nativeName" label="Native Name" variant="outlined" density="comfortable" class="mb-2" />
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
