<script setup lang="ts">
import type { Location, Company, Vendor, Bank, Country, Province, City } from '~/types/resources'

useSeo({ title: 'Locations' })

const { items, total, loading, list, create, update, remove } = useResourceCrud<Location>('/locations')
const { items: companies, list: listCompanies } = useResourceCrud<Company>('/companies')
const { items: vendors, list: listVendors } = useResourceCrud<Vendor>('/vendors')
const { items: banks, list: listBanks } = useResourceCrud<Bank>('/banks')
const { items: countries, list: listCountries } = useResourceCrud<Country>('/countries')
const { items: provinces, list: listProvinces } = useResourceCrud<Province>('/provinces')
const { items: cities, list: listCities } = useResourceCrud<City>('/cities')
const { confirm } = useConfirm()

const page = ref(1)
const itemsPerPage = 25
const companyFilter = ref<string | null>(null)
const vendorFilter = ref<string | null>(null)
const bankFilter = ref<string | null>(null)

const nameOf = (list: { id: string; name: string }[], id: string | null) =>
  list.find((x) => x.id === id)?.name ?? '—'

const headers = [
  { title: 'City', key: 'city', width: '160' },
  { title: 'Address', key: 'addressLine1' },
  { title: 'Company', key: 'companyId', width: '140' },
  { title: 'Vendor', key: 'vendorId', width: '140' },
  { title: 'Bank', key: 'bankId', width: '140' },
  { title: 'HQ', key: 'isHeadquarters', width: '70' },
]

const load = () => list({
  limit: itemsPerPage,
  offset: (page.value - 1) * itemsPerPage,
  companyId: companyFilter.value || undefined,
  vendorId: vendorFilter.value || undefined,
  bankId: bankFilter.value || undefined,
})

watch(page, load)
watch([companyFilter, vendorFilter, bankFilter], () => { page.value = 1; load() })
onMounted(async () => {
  await Promise.all([
    listCompanies({ limit: 200 }),
    listVendors({ limit: 200 }),
    listBanks({ limit: 200 }),
    listCountries({ limit: 300 }),
    listProvinces({ limit: 500 }),
    listCities({ limit: 500 }),
  ])
  await load()
})

const editDialog = ref(false)
const editing = ref<Location | null>(null)
const form = reactive<{
  companyId: string | null
  vendorId: string | null
  bankId: string | null
  isHeadquarters: boolean
  addressLine1: string
  addressLine2: string
  city: string
  provinceId: string | null
  cityId: string | null
  postalCode: string
  countryId: string | null
  latitude: number | null
  longitude: number | null
  metadata: Record<string, unknown> | null
}>({
  companyId: null, vendorId: null, bankId: null, isHeadquarters: false, addressLine1: '', addressLine2: '',
  city: '', provinceId: null, cityId: null, postalCode: '', countryId: null,
  latitude: null, longitude: null, metadata: null,
})

const provincesForForm = computed(() =>
  form.countryId ? provinces.value.filter((p) => p.countryId === form.countryId) : provinces.value,
)
const citiesForForm = computed(() =>
  form.provinceId
    ? cities.value.filter((c) => c.provinceId === form.provinceId)
    : form.countryId
      ? cities.value.filter((c) => c.countryId === form.countryId)
      : cities.value,
)

watch(() => form.countryId, () => { form.provinceId = null; form.cityId = null })
watch(() => form.provinceId, () => { form.cityId = null })

const resetForm = () => Object.assign(form, {
  companyId: null, vendorId: null, bankId: null, isHeadquarters: false, addressLine1: '', addressLine2: '',
  city: '', provinceId: null, cityId: null, postalCode: '', countryId: null,
  latitude: null, longitude: null, metadata: null,
})

const openCreate = () => {
  editing.value = null
  resetForm()
  editDialog.value = true
}

const openEdit = (item: Location) => {
  editing.value = item
  Object.assign(form, {
    companyId: item.companyId, vendorId: item.vendorId, bankId: item.bankId, isHeadquarters: item.isHeadquarters,
    addressLine1: item.addressLine1, addressLine2: item.addressLine2 ?? '', city: item.city,
    provinceId: item.provinceId, cityId: item.cityId, postalCode: item.postalCode ?? '', countryId: item.countryId,
    latitude: item.latitude, longitude: item.longitude, metadata: item.metadata,
  })
  editDialog.value = true
}

const save = async () => {
  const body: Record<string, unknown> = {
    addressLine1: form.addressLine1,
    city: form.city,
    isHeadquarters: form.isHeadquarters,
    metadata: form.metadata,
  }
  if (form.companyId) body.companyId = form.companyId
  if (form.vendorId) body.vendorId = form.vendorId
  if (form.bankId) body.bankId = form.bankId
  if (form.addressLine2) body.addressLine2 = form.addressLine2
  if (form.provinceId) body.provinceId = form.provinceId
  if (form.cityId) body.cityId = form.cityId
  if (form.postalCode) body.postalCode = form.postalCode
  if (form.countryId) body.countryId = form.countryId
  if (form.latitude !== null) body.latitude = form.latitude
  if (form.longitude !== null) body.longitude = form.longitude

  if (editing.value) await update(editing.value.id, body)
  else await create(body)
  editDialog.value = false
  await load()
}

const onDelete = async (item: Location) => {
  if (!(await confirm({ title: 'Delete location', message: `Delete "${item.addressLine1}, ${item.city}"? This cannot be undone.`, color: 'error' }))) return
  await remove(item.id)
  await load()
}

const viewDialog = ref(false)
const viewing = ref<Location | null>(null)

const openView = (item: Location) => {
  viewing.value = item
  viewDialog.value = true
}

const viewFields = computed(() => viewing.value ? [
  { label: 'Company', value: nameOf(companies.value, viewing.value.companyId) },
  { label: 'Vendor', value: nameOf(vendors.value, viewing.value.vendorId) },
  { label: 'Bank', value: nameOf(banks.value, viewing.value.bankId) },
  { label: 'Headquarters', value: viewing.value.isHeadquarters },
  { label: 'Address Line 1', value: viewing.value.addressLine1 },
  { label: 'Address Line 2', value: viewing.value.addressLine2 },
  { label: 'City (free text)', value: viewing.value.city },
  { label: 'City (reference)', value: nameOf(cities.value, viewing.value.cityId) },
  { label: 'Province', value: nameOf(provinces.value, viewing.value.provinceId) },
  { label: 'Postal Code', value: viewing.value.postalCode },
  { label: 'Country', value: nameOf(countries.value, viewing.value.countryId) },
  { label: 'Latitude', value: viewing.value.latitude },
  { label: 'Longitude', value: viewing.value.longitude },
  { label: 'Created', value: new Date(viewing.value.createdAt).toLocaleString() },
  { label: 'Updated', value: new Date(viewing.value.updatedAt).toLocaleString() },
] : [])
</script>

<template>
  <div>
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <h1 class="text-h5 font-weight-bold mr-auto">Locations</h1>
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
        v-model="vendorFilter"
        :items="vendors"
        item-title="name"
        item-value="id"
        label="Vendor"
        clearable
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 180px;"
      />
      <v-select
        v-model="bankFilter"
        :items="banks"
        item-title="name"
        item-value="id"
        label="Bank"
        clearable
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 180px;"
      />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">New Location</v-btn>
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
      <template #item.vendorId="{ item }">{{ nameOf(vendors, item.vendorId) }}</template>
      <template #item.bankId="{ item }">{{ nameOf(banks, item.bankId) }}</template>
      <template #item.isHeadquarters="{ item }">
        <v-icon v-if="item.isHeadquarters" icon="mdi-check" color="success" size="18" />
      </template>
    </CommonResourceTable>

    <CommonRecordViewDialog
      v-model="viewDialog"
      title="Location Details"
      :fields="viewFields"
      :metadata="viewing?.metadata"
    />

    <v-dialog v-model="editDialog" max-width="560">
      <v-card rounded="lg">
        <v-card-title class="text-h6 pt-6 px-6">{{ editing ? 'Edit Location' : 'New Location' }}</v-card-title>
        <v-card-text class="px-6">
          <v-row dense>
            <v-col cols="6">
              <v-select
                v-model="form.companyId"
                :items="companies"
                item-title="name"
                item-value="id"
                label="Company"
                clearable
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="form.vendorId"
                :items="vendors"
                item-title="name"
                item-value="id"
                label="Vendor"
                clearable
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>
          <v-select
            v-model="form.bankId"
            :items="banks"
            item-title="name"
            item-value="id"
            label="Bank"
            clearable
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />
          <v-checkbox v-model="form.isHeadquarters" label="Headquarters" density="compact" hide-details class="mb-2" />
          <v-text-field v-model="form.addressLine1" label="Address Line 1" variant="outlined" density="comfortable" class="mb-2" />
          <v-text-field v-model="form.addressLine2" label="Address Line 2" variant="outlined" density="comfortable" class="mb-2" />
          <v-text-field v-model="form.city" label="City (free text)" variant="outlined" density="comfortable" class="mb-2" />
          <v-row dense>
            <v-col cols="6">
              <v-select
                v-model="form.countryId"
                :items="countries"
                item-title="name"
                item-value="id"
                label="Country"
                clearable
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="form.postalCode" label="Postal Code" variant="outlined" density="comfortable" />
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="6">
              <v-select
                v-model="form.provinceId"
                :items="provincesForForm"
                item-title="name"
                item-value="id"
                label="Province (optional)"
                clearable
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="form.cityId"
                :items="citiesForForm"
                item-title="name"
                item-value="id"
                label="City (reference, optional)"
                clearable
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>
          <v-row dense class="mb-2">
            <v-col cols="6">
              <v-text-field v-model.number="form.latitude" label="Latitude" type="number" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model.number="form.longitude" label="Longitude" type="number" variant="outlined" density="comfortable" />
            </v-col>
          </v-row>
          <CommonMetadataEditor v-model="form.metadata" />
          <template v-if="editing">
            <p class="text-body-2 font-weight-medium mt-4 mb-2">Tags</p>
            <CommonTagEditor base-path="/locations" :entity-id="editing.id" />
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
