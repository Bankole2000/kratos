<script setup lang="ts">
import type { Tag } from '~/types/resources'

useSeo({ title: 'Tags' })

const { items, total, loading, list, create, update, remove } = useResourceCrud<Tag>('/tags')
const { confirm } = useConfirm()

const page = ref(1)
const itemsPerPage = 25
const search = ref('')

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Created', key: 'createdAt', width: '180' },
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
const editing = ref<Tag | null>(null)
const form = reactive<{ name: string; metadata: Record<string, unknown> | null }>({ name: '', metadata: null })

const openCreate = () => {
  editing.value = null
  Object.assign(form, { name: '', metadata: null })
  editDialog.value = true
}

const openEdit = (item: Tag) => {
  editing.value = item
  Object.assign(form, { name: item.name, metadata: item.metadata })
  editDialog.value = true
}

const save = async () => {
  const body: Record<string, unknown> = { name: form.name, metadata: form.metadata }
  if (editing.value) await update(editing.value.id, body)
  else await create(body)
  editDialog.value = false
  await load()
}

const onDelete = async (item: Tag) => {
  if (!(await confirm({ title: 'Delete tag', message: `Delete "${item.name}"? This removes it from every entity it's attached to.`, color: 'error' }))) return
  await remove(item.id)
  await load()
}

const viewDialog = ref(false)
const viewing = ref<Tag | null>(null)

const openView = (item: Tag) => {
  viewing.value = item
  viewDialog.value = true
}

const viewFields = computed(() => viewing.value ? [
  { label: 'Name', value: viewing.value.name },
  { label: 'Created', value: new Date(viewing.value.createdAt).toLocaleString() },
  { label: 'Updated', value: new Date(viewing.value.updatedAt).toLocaleString() },
] : [])
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h5 font-weight-bold">Tags</h1>
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
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">New Tag</v-btn>
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
      <template #item.createdAt="{ item }">
        {{ new Date(item.createdAt).toLocaleDateString() }}
      </template>
    </CommonResourceTable>

    <CommonRecordViewDialog
      v-model="viewDialog"
      title="Tag Details"
      :fields="viewFields"
      :metadata="viewing?.metadata"
    />

    <v-dialog v-model="editDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title class="text-h6 pt-6 px-6">{{ editing ? 'Edit Tag' : 'New Tag' }}</v-card-title>
        <v-card-text class="px-6">
          <v-text-field v-model="form.name" label="Name" variant="outlined" density="comfortable" class="mb-2" />
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
