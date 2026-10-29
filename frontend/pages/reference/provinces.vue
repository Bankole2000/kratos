<script setup lang="ts">
import type { Province, Country } from '~/types/resources'

useSeo({ title: 'Provinces' })

const { items, total, loading, list, create, update, remove } = useResourceCrud<Province>('/provinces')
const { items: countries, list: listCountries } = useResourceCrud<Country>('/countries')
const { confirm } = useConfirm()

const page = ref(1)
const itemsPerPage = 25
const search = ref('')
const countryFilter = ref<string | null>(null)

const countryName = (id: string | null) => countries.value.find((c) => c.id === id)?.name ?? '—'

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Code', key: 'code', width: '100' },
  { title: 'Type', key: 'divisionType', width: '140' },
  { title: 'Country', key: 'countryId', width: '180' },
]

const load = () => list({
  limit: itemsPerPage,
  offset: (page.value - 1) * itemsPerPage,
  search: search.value || undefined,
  countryId: countryFilter.value || undefined,
})

watch(page, load)
watch([search, countryFilter], () => { page.value = 1; load() })
onMounted(async () => {
  await listCountries({ limit: 300 })
  await load()
})

const editDialog = ref(false)
const editing = ref<Province | null>(null)
const form = reactive<{
  countryId: string | null
  name: string
  code: string
  divisionType: string
  metadata: Record<string, unknown> | null
}>({ countryId: null, name: '', code: '', divisionType: '', metadata: null })

const openCreate = () => {
  editing.value = null
  Object.assign(form, { countryId: countryFilter.value, name: '', code: '', divisionType: '', metadata: null })
  editDialog.value = true
}

const openEdit = (item: Province) => {
  editing.value = item
  Object.assign(form, {
    countryId: item.countryId, name: item.name, code: item.code ?? '',
    divisionType: item.divisionType, metadata: item.metadata,
  })
  editDialog.value = true
}

const save = async () => {
  const body: Record<string, unknown> = {
    countryId: form.countryId,
    name: form.name,
    divisionType: form.divisionType,
    metadata: form.metadata,
  }
  if (form.code) body.code = form.code
  if (editing.value) await update(editing.value.id, body)
  else await create(body)
  editDialog.value = false
  await load()
}

const onDelete = async (item: Province) => {
  if (!(await confirm({ title: 'Delete province', message: `Delete "${item.name}"? This cannot be undone.`, color: 'error' }))) return
  await remove(item.id)
  await load()
}

const viewDialog = ref(false)
const viewing = ref<Province | null>(null)

const openView = (item: Province) => {
  viewing.value = item
  viewDialog.value = true
}

const viewFields = computed(() => viewing.value ? [
  { label: 'Name', value: viewing.value.name },
  { label: 'Code', value: viewing.value.code },
  { label: 'Type', value: viewing.value.divisionType },
  { label: 'Country', value: countryName(viewing.value.countryId) },
  { label: 'Created', value: new Date(viewing.value.createdAt).toLocaleString() },
  { label: 'Updated', value: new Date(viewing.value.updatedAt).toLocaleString() },
] : [])
</script>

<template>
  <div>
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <h1 class="text-h5 font-weight-bold mr-auto">Provinces</h1>
      <v-select
        v-model="countryFilter"
        :items="countries"
        item-title="name"
        item-value="id"
        label="Country"
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
        style="max-width: 220px;"
      />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">New Province</v-btn>
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
      <template #item.countryId="{ item }">{{ countryName(item.countryId) }}</template>
    </CommonResourceTable>

    <CommonRecordViewDialog
      v-model="viewDialog"
      title="Province Details"
      :fields="viewFields"
      :metadata="viewing?.metadata"
    />

    <v-dialog v-model="editDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title class="text-h6 pt-6 px-6">{{ editing ? 'Edit Province' : 'New Province' }}</v-card-title>
        <v-card-text class="px-6">
          <v-select
            v-model="form.countryId"
            :items="countries"
            item-title="name"
            item-value="id"
            label="Country"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />
          <v-text-field v-model="form.name" label="Name" variant="outlined" density="comfortable" class="mb-2" />
          <v-row dense>
            <v-col cols="6">
              <v-text-field v-model="form.code" label="Code (optional)" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.divisionType"
                label="Type"
                placeholder="state, province, region, prefecture..."
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>
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
