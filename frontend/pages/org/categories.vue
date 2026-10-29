<script setup lang="ts">
import type { Category, CategoryGroup } from '~/types/resources'

useSeo({ title: 'Categories' })

const { items, total, loading, list, create, update, remove } = useResourceCrud<Category>('/categories')
const { items: groups, list: listGroups } = useResourceCrud<CategoryGroup>('/category-groups')
const { confirm } = useConfirm()

const page = ref(1)
const itemsPerPage = 25
const search = ref('')
const groupFilter = ref<string | null>(null)

const groupName = (id: string | null) => groups.value.find((g) => g.id === id)?.name ?? '—'

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Group', key: 'groupId', width: '220' },
]

const load = () => list({
  limit: itemsPerPage,
  offset: (page.value - 1) * itemsPerPage,
  search: search.value || undefined,
  groupId: groupFilter.value || undefined,
})

watch(page, load)
watch([search, groupFilter], () => { page.value = 1; load() })
onMounted(async () => {
  await listGroups({ limit: 200 })
  await load()
})

const editDialog = ref(false)
const editing = ref<Category | null>(null)
const form = reactive<{ name: string; groupId: string | null; metadata: Record<string, unknown> | null }>({
  name: '', groupId: null, metadata: null,
})

const openCreate = () => {
  editing.value = null
  Object.assign(form, { name: '', groupId: null, metadata: null })
  editDialog.value = true
}

const openEdit = (item: Category) => {
  editing.value = item
  Object.assign(form, { name: item.name, groupId: item.groupId, metadata: item.metadata })
  editDialog.value = true
}

const save = async () => {
  const body: Record<string, unknown> = { name: form.name, metadata: form.metadata }
  if (form.groupId) body.groupId = form.groupId
  if (editing.value) await update(editing.value.id, body)
  else await create(body)
  editDialog.value = false
  await load()
}

const onDelete = async (item: Category) => {
  if (!(await confirm({ title: 'Delete category', message: `Delete "${item.name}"? This cannot be undone.`, color: 'error' }))) return
  await remove(item.id)
  await load()
}

const viewDialog = ref(false)
const viewing = ref<Category | null>(null)

const openView = (item: Category) => {
  viewing.value = item
  viewDialog.value = true
}

const viewFields = computed(() => viewing.value ? [
  { label: 'Name', value: viewing.value.name },
  { label: 'Group', value: groupName(viewing.value.groupId) },
  { label: 'Created', value: new Date(viewing.value.createdAt).toLocaleString() },
  { label: 'Updated', value: new Date(viewing.value.updatedAt).toLocaleString() },
] : [])
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h5 font-weight-bold">Categories</h1>
      <v-spacer />
      <v-select
        v-model="groupFilter"
        :items="groups"
        item-title="name"
        item-value="id"
        label="Filter by group"
        clearable
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 220px;"
        class="mr-3"
      />
      <v-text-field
        v-model="search"
        placeholder="Search by name"
        prepend-inner-icon="mdi-magnify"
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 240px;"
        class="mr-3"
      />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">New Category</v-btn>
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
      <template #item.groupId="{ item }">
        {{ groupName(item.groupId) }}
      </template>
    </CommonResourceTable>

    <CommonRecordViewDialog
      v-model="viewDialog"
      title="Category Details"
      :fields="viewFields"
      :metadata="viewing?.metadata"
    />

    <v-dialog v-model="editDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title class="text-h6 pt-6 px-6">{{ editing ? 'Edit Category' : 'New Category' }}</v-card-title>
        <v-card-text class="px-6">
          <v-text-field v-model="form.name" label="Name" variant="outlined" density="comfortable" class="mb-2" />
          <v-select
            v-model="form.groupId"
            :items="groups"
            item-title="name"
            item-value="id"
            label="Category Group"
            clearable
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />
          <CommonMetadataEditor v-model="form.metadata" />
          <template v-if="editing">
            <p class="text-body-2 font-weight-medium mt-4 mb-2">Tags</p>
            <CommonTagEditor base-path="/categories" :entity-id="editing.id" />
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
