<script setup lang="ts">
import type { Project } from '~/types/resources'

useSeo({ title: 'Projects' })

const { items, total, loading, list, create, update, remove } = useResourceCrud<Project>('/projects')
const { confirm } = useConfirm()
const router = useRouter()

const page = ref(1)
const itemsPerPage = 25
const search = ref('')

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Slug', key: 'slug', width: '200' },
  { title: 'Description', key: 'description' },
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
const editing = ref<Project | null>(null)
const form = reactive<{ name: string; slug: string; description: string | null }>({ name: '', slug: '', description: null })

const openCreate = () => {
  editing.value = null
  Object.assign(form, { name: '', slug: '', description: null })
  editDialog.value = true
}

const openEdit = (item: Project) => {
  editing.value = item
  Object.assign(form, { name: item.name, slug: item.slug, description: item.description })
  editDialog.value = true
}

const save = async () => {
  const body: Record<string, unknown> = { name: form.name, slug: form.slug, description: form.description || undefined }
  if (editing.value) await update(editing.value.id, body)
  else await create(body)
  editDialog.value = false
  await load()
}

const onDelete = async (item: Project) => {
  if (!(await confirm({
    title: 'Delete project',
    message: `Delete "${item.name}"? This also removes its API keys and notification template overrides. This cannot be undone.`,
    color: 'error',
  }))) return
  await remove(item.id)
  await load()
}

const goToTemplates = (item: Project) => router.push(`/projects/${item.id}/templates`)

const viewDialog = ref(false)
const viewing = ref<Project | null>(null)

const openView = (item: Project) => {
  viewing.value = item
  viewDialog.value = true
}

const viewFields = computed(() => viewing.value ? [
  { label: 'Name', value: viewing.value.name },
  { label: 'Slug', value: viewing.value.slug },
  { label: 'Description', value: viewing.value.description ?? '—' },
  { label: 'Created', value: new Date(viewing.value.createdAt).toLocaleString() },
  { label: 'Updated', value: new Date(viewing.value.updatedAt).toLocaleString() },
] : [])
</script>

<template>
  <div>
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <h1 class="text-h5 font-weight-bold mr-auto">Projects</h1>
      <v-text-field
        v-model="search"
        placeholder="Search by name"
        prepend-inner-icon="mdi-magnify"
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 220px;"
      />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">New Project</v-btn>
    </div>

    <CommonResourceTable
      :headers="[...headers, { title: '', key: 'templates', sortable: false, width: '48' }]"
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
      <template #item.description="{ item }">{{ item.description ?? '—' }}</template>
      <template #item.templates="{ item }">
        <v-btn icon="mdi-email-outline" variant="text" size="small" @click="goToTemplates(item)" />
      </template>
    </CommonResourceTable>

    <CommonRecordViewDialog
      v-model="viewDialog"
      title="Project Details"
      :fields="viewFields"
    />

    <v-dialog v-model="editDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title class="text-h6 pt-6 px-6">{{ editing ? 'Edit Project' : 'New Project' }}</v-card-title>
        <v-card-text class="px-6">
          <v-text-field v-model="form.name" label="Name" variant="outlined" density="comfortable" class="mb-2" />
          <v-text-field v-model="form.slug" label="Slug" hint="Stable machine-readable identifier" persistent-hint variant="outlined" density="comfortable" class="mb-2" />
          <v-textarea v-model="form.description" label="Description" variant="outlined" density="comfortable" rows="2" />
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
