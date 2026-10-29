<script setup lang="ts">
import type { Bank, Company } from '~/types/resources'

useSeo({ title: 'Banks' })

const { items, total, loading, list, create, update, remove } = useResourceCrud<Bank>('/banks')
const { items: companies, list: listCompanies } = useResourceCrud<Company>('/companies')
const { confirm } = useConfirm()

const page = ref(1)
const itemsPerPage = 25
const search = ref('')
const companyFilter = ref<string | null>(null)

const companyName = (id: string | null) => companies.value.find((c) => c.id === id)?.name ?? '—'

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'SWIFT/BIC', key: 'swiftBic', width: '140' },
  { title: 'Company', key: 'companyId', width: '180' },
]

const load = () => list({
  limit: itemsPerPage,
  offset: (page.value - 1) * itemsPerPage,
  search: search.value || undefined,
  companyId: companyFilter.value || undefined,
})

watch(page, load)
watch([search, companyFilter], () => { page.value = 1; load() })
onMounted(async () => {
  await listCompanies({ limit: 200 })
  await load()
})

const editDialog = ref(false)
const editing = ref<Bank | null>(null)
const form = reactive<{
  name: string
  companyId: string | null
  swiftBic: string
  website: string
  metadata: Record<string, unknown> | null
}>({ name: '', companyId: null, swiftBic: '', website: '', metadata: null })

const openCreate = () => {
  editing.value = null
  Object.assign(form, { name: '', companyId: companyFilter.value, swiftBic: '', website: '', metadata: null })
  editDialog.value = true
}

const openEdit = (item: Bank) => {
  editing.value = item
  Object.assign(form, {
    name: item.name, companyId: item.companyId, swiftBic: item.swiftBic ?? '',
    website: item.website ?? '', metadata: item.metadata,
  })
  editDialog.value = true
}

const save = async () => {
  const body: Record<string, unknown> = { name: form.name, metadata: form.metadata }
  if (form.companyId) body.companyId = form.companyId
  if (form.swiftBic) body.swiftBic = form.swiftBic
  if (form.website) body.website = form.website
  if (editing.value) await update(editing.value.id, body)
  else await create(body)
  editDialog.value = false
  await load()
}

const onDelete = async (item: Bank) => {
  if (!(await confirm({ title: 'Delete bank', message: `Delete "${item.name}"? This cannot be undone.`, color: 'error' }))) return
  await remove(item.id)
  await load()
}

const viewDialog = ref(false)
const viewing = ref<Bank | null>(null)

const openView = (item: Bank) => {
  viewing.value = item
  viewDialog.value = true
}

const viewFields = computed(() => viewing.value ? [
  { label: 'Name', value: viewing.value.name },
  { label: 'SWIFT/BIC', value: viewing.value.swiftBic },
  { label: 'Website', value: viewing.value.website },
  { label: 'Company', value: companyName(viewing.value.companyId) },
  { label: 'Created', value: new Date(viewing.value.createdAt).toLocaleString() },
  { label: 'Updated', value: new Date(viewing.value.updatedAt).toLocaleString() },
] : [])
</script>

<template>
  <div>
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <h1 class="text-h5 font-weight-bold mr-auto">Banks</h1>
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
        style="max-width: 200px;"
      />
      <v-text-field
        v-model="search"
        placeholder="Search by name"
        prepend-inner-icon="mdi-magnify"
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 240px;"
      />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">New Bank</v-btn>
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
      <template #item.companyId="{ item }">{{ companyName(item.companyId) }}</template>
    </CommonResourceTable>

    <CommonRecordViewDialog
      v-model="viewDialog"
      title="Bank Details"
      :fields="viewFields"
      :metadata="viewing?.metadata"
    />

    <v-dialog v-model="editDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title class="text-h6 pt-6 px-6">{{ editing ? 'Edit Bank' : 'New Bank' }}</v-card-title>
        <v-card-text class="px-6">
          <v-text-field v-model="form.name" label="Name" variant="outlined" density="comfortable" class="mb-2" />
          <v-select
            v-model="form.companyId"
            :items="companies"
            item-title="name"
            item-value="id"
            label="Company (optional)"
            clearable
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />
          <v-row dense>
            <v-col cols="6">
              <v-text-field v-model="form.swiftBic" label="SWIFT/BIC" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="form.website" label="Website" variant="outlined" density="comfortable" />
            </v-col>
          </v-row>
          <CommonMetadataEditor v-model="form.metadata" />
          <template v-if="editing">
            <p class="text-body-2 font-weight-medium mt-4 mb-2">Tags</p>
            <CommonTagEditor base-path="/banks" :entity-id="editing.id" />
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
