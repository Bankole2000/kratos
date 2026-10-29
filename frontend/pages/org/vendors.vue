<script setup lang="ts">
import type { Vendor, Company, Category, Industry } from '~/types/resources'

useSeo({ title: 'Vendors' })

const { items, total, loading, list, create, update, remove } = useResourceCrud<Vendor>('/vendors')
const { items: companies, list: listCompanies } = useResourceCrud<Company>('/companies')
const { items: categories, list: listCategories } = useResourceCrud<Category>('/categories')
const { items: industries, list: listIndustries } = useResourceCrud<Industry>('/industries')
const { confirm } = useConfirm()

const page = ref(1)
const itemsPerPage = 25
const search = ref('')
const companyFilter = ref<string | null>(null)
const categoryFilter = ref<string | null>(null)
const industryFilter = ref<string | null>(null)

const nameOf = (list: { id: string; name: string }[], id: string | null) =>
  list.find((x) => x.id === id)?.name ?? '—'

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Company', key: 'companyId', width: '180' },
  { title: 'Category', key: 'categoryId', width: '180' },
  { title: 'Industry', key: 'industryId', width: '180' },
]

const load = () => list({
  limit: itemsPerPage,
  offset: (page.value - 1) * itemsPerPage,
  search: search.value || undefined,
  companyId: companyFilter.value || undefined,
  categoryId: categoryFilter.value || undefined,
  industryId: industryFilter.value || undefined,
})

watch(page, load)
watch([search, companyFilter, categoryFilter, industryFilter], () => { page.value = 1; load() })
onMounted(async () => {
  await Promise.all([
    listCompanies({ limit: 200 }),
    listCategories({ limit: 200 }),
    listIndustries({ limit: 200 }),
  ])
  await load()
})

const editDialog = ref(false)
const editing = ref<Vendor | null>(null)
const form = reactive<{
  name: string
  companyId: string | null
  categoryId: string | null
  industryId: string | null
  metadata: Record<string, unknown> | null
}>({ name: '', companyId: null, categoryId: null, industryId: null, metadata: null })

const openCreate = () => {
  editing.value = null
  Object.assign(form, { name: '', companyId: null, categoryId: null, industryId: null, metadata: null })
  editDialog.value = true
}

const openEdit = (item: Vendor) => {
  editing.value = item
  Object.assign(form, {
    name: item.name, companyId: item.companyId, categoryId: item.categoryId,
    industryId: item.industryId, metadata: item.metadata,
  })
  editDialog.value = true
}

const save = async () => {
  const body: Record<string, unknown> = { name: form.name, metadata: form.metadata }
  if (form.companyId) body.companyId = form.companyId
  if (form.categoryId) body.categoryId = form.categoryId
  if (form.industryId) body.industryId = form.industryId
  if (editing.value) await update(editing.value.id, body)
  else await create(body)
  editDialog.value = false
  await load()
}

const onDelete = async (item: Vendor) => {
  if (!(await confirm({ title: 'Delete vendor', message: `Delete "${item.name}"? This cannot be undone.`, color: 'error' }))) return
  await remove(item.id)
  await load()
}

const viewDialog = ref(false)
const viewing = ref<Vendor | null>(null)

const openView = (item: Vendor) => {
  viewing.value = item
  viewDialog.value = true
}

const viewFields = computed(() => viewing.value ? [
  { label: 'Name', value: viewing.value.name },
  { label: 'Company', value: nameOf(companies.value, viewing.value.companyId) },
  { label: 'Category', value: nameOf(categories.value, viewing.value.categoryId) },
  { label: 'Industry', value: nameOf(industries.value, viewing.value.industryId) },
  { label: 'Created', value: new Date(viewing.value.createdAt).toLocaleString() },
  { label: 'Updated', value: new Date(viewing.value.updatedAt).toLocaleString() },
] : [])
</script>

<template>
  <div>
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <h1 class="text-h5 font-weight-bold mr-auto">Vendors</h1>
      <v-select
        v-model="companyFilter"
        :items="companies"
        item-title="name"
        item-value="id"
        label="Company"
        clearable
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 180px;"
      />
      <v-select
        v-model="categoryFilter"
        :items="categories"
        item-title="name"
        item-value="id"
        label="Category"
        clearable
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 180px;"
      />
      <v-select
        v-model="industryFilter"
        :items="industries"
        item-title="name"
        item-value="id"
        label="Industry"
        clearable
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 180px;"
      />
      <v-text-field
        v-model="search"
        placeholder="Search by name"
        prepend-inner-icon="mdi-magnify"
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 220px;"
      />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">New Vendor</v-btn>
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
      <template #item.companyId="{ item }">{{ nameOf(companies, item.companyId) }}</template>
      <template #item.categoryId="{ item }">{{ nameOf(categories, item.categoryId) }}</template>
      <template #item.industryId="{ item }">{{ nameOf(industries, item.industryId) }}</template>
    </CommonResourceTable>

    <CommonRecordViewDialog
      v-model="viewDialog"
      title="Vendor Details"
      :fields="viewFields"
      :metadata="viewing?.metadata"
    />

    <v-dialog v-model="editDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title class="text-h6 pt-6 px-6">{{ editing ? 'Edit Vendor' : 'New Vendor' }}</v-card-title>
        <v-card-text class="px-6">
          <v-text-field v-model="form.name" label="Name" variant="outlined" density="comfortable" class="mb-2" />
          <v-select
            v-model="form.companyId"
            :items="companies"
            item-title="name"
            item-value="id"
            label="Company"
            clearable
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />
          <v-select
            v-model="form.categoryId"
            :items="categories"
            item-title="name"
            item-value="id"
            label="Category"
            clearable
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />
          <v-select
            v-model="form.industryId"
            :items="industries"
            item-title="name"
            item-value="id"
            label="Industry"
            clearable
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />
          <CommonMetadataEditor v-model="form.metadata" />
          <template v-if="editing">
            <p class="text-body-2 font-weight-medium mt-4 mb-2">Tags</p>
            <CommonTagEditor base-path="/vendors" :entity-id="editing.id" />
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
