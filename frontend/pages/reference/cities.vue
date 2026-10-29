<script setup lang="ts">
import type { City, Province, Country } from '~/types/resources'

useSeo({ title: 'Cities' })

const { items, total, loading, list, create, update, remove } = useResourceCrud<City>('/cities')
const { items: countries, list: listCountries } = useResourceCrud<Country>('/countries')
const { items: provinces, list: listProvinces } = useResourceCrud<Province>('/provinces')
const { confirm } = useConfirm()

const page = ref(1)
const itemsPerPage = 25
const search = ref('')
const countryFilter = ref<string | null>(null)
const provinceFilter = ref<string | null>(null)

const countryName = (id: string | null) => countries.value.find((c) => c.id === id)?.name ?? '—'
const provinceName = (id: string | null) => provinces.value.find((p) => p.id === id)?.name ?? '—'

const provincesForFilter = computed(() =>
  countryFilter.value ? provinces.value.filter((p) => p.countryId === countryFilter.value) : provinces.value,
)

watch(countryFilter, () => { provinceFilter.value = null })

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Province', key: 'provinceId', width: '180' },
  { title: 'Country', key: 'countryId', width: '180' },
]

const load = () => list({
  limit: itemsPerPage,
  offset: (page.value - 1) * itemsPerPage,
  search: search.value || undefined,
  countryId: countryFilter.value || undefined,
  provinceId: provinceFilter.value || undefined,
})

watch(page, load)
watch([search, countryFilter, provinceFilter], () => { page.value = 1; load() })
onMounted(async () => {
  await Promise.all([
    listCountries({ limit: 300 }),
    listProvinces({ limit: 500 }),
  ])
  await load()
})

const editDialog = ref(false)
const editing = ref<City | null>(null)
const form = reactive<{
  countryId: string | null
  provinceId: string | null
  name: string
  metadata: Record<string, unknown> | null
}>({ countryId: null, provinceId: null, name: '', metadata: null })

const provincesForForm = computed(() =>
  form.countryId ? provinces.value.filter((p) => p.countryId === form.countryId) : provinces.value,
)

watch(() => form.countryId, () => { form.provinceId = null })

const openCreate = () => {
  editing.value = null
  Object.assign(form, { countryId: countryFilter.value, provinceId: null, name: '', metadata: null })
  editDialog.value = true
}

const openEdit = (item: City) => {
  editing.value = item
  Object.assign(form, {
    countryId: item.countryId, provinceId: item.provinceId, name: item.name, metadata: item.metadata,
  })
  editDialog.value = true
}

const save = async () => {
  const body: Record<string, unknown> = {
    countryId: form.countryId,
    name: form.name,
    metadata: form.metadata,
  }
  if (form.provinceId) body.provinceId = form.provinceId
  if (editing.value) await update(editing.value.id, body)
  else await create(body)
  editDialog.value = false
  await load()
}

const onDelete = async (item: City) => {
  if (!(await confirm({ title: 'Delete city', message: `Delete "${item.name}"? This cannot be undone.`, color: 'error' }))) return
  await remove(item.id)
  await load()
}

const viewDialog = ref(false)
const viewing = ref<City | null>(null)

const openView = (item: City) => {
  viewing.value = item
  viewDialog.value = true
}

const viewFields = computed(() => viewing.value ? [
  { label: 'Name', value: viewing.value.name },
  { label: 'Province', value: provinceName(viewing.value.provinceId) },
  { label: 'Country', value: countryName(viewing.value.countryId) },
  { label: 'Created', value: new Date(viewing.value.createdAt).toLocaleString() },
  { label: 'Updated', value: new Date(viewing.value.updatedAt).toLocaleString() },
] : [])
</script>

<template>
  <div>
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <h1 class="text-h5 font-weight-bold mr-auto">Cities</h1>
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
        style="max-width: 180px;"
      />
      <v-select
        v-model="provinceFilter"
        :items="provincesForFilter"
        item-title="name"
        item-value="id"
        label="Province"
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
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">New City</v-btn>
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
      <template #item.provinceId="{ item }">{{ provinceName(item.provinceId) }}</template>
      <template #item.countryId="{ item }">{{ countryName(item.countryId) }}</template>
    </CommonResourceTable>

    <CommonRecordViewDialog
      v-model="viewDialog"
      title="City Details"
      :fields="viewFields"
      :metadata="viewing?.metadata"
    />

    <v-dialog v-model="editDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title class="text-h6 pt-6 px-6">{{ editing ? 'Edit City' : 'New City' }}</v-card-title>
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
          <v-select
            v-model="form.provinceId"
            :items="provincesForForm"
            item-title="name"
            item-value="id"
            label="Province (optional)"
            clearable
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />
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
