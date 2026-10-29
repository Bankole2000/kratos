<script setup lang="ts">
import type { Unit } from '~/types/resources'

useSeo({ title: 'Units' })

const { items, total, loading, list, create, update, remove } = useResourceCrud<Unit>('/units')
const { items: allUnits, list: listAllUnits } = useResourceCrud<Unit>('/units')
const { confirm } = useConfirm()

const page = ref(1)
const itemsPerPage = 25
const search = ref('')
const categoryFilter = ref<string | null>(null)

const knownCategories = computed(() => [...new Set(allUnits.value.map((u) => u.unitCategory))].sort())

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Symbol', key: 'symbol', width: '100' },
  { title: 'Category', key: 'unitCategory', width: '130' },
  { title: 'Base?', key: 'isBaseUnit', width: '70' },
  { title: 'Conversion Factor', key: 'conversionFactor', width: '160' },
]

const load = () => list({
  limit: itemsPerPage,
  offset: (page.value - 1) * itemsPerPage,
  search: search.value || undefined,
  unitCategory: categoryFilter.value || undefined,
})

watch(page, load)
watch([search, categoryFilter], () => { page.value = 1; load() })
onMounted(async () => {
  await listAllUnits({ limit: 200 })
  await load()
})

const editDialog = ref(false)
const editing = ref<Unit | null>(null)
const form = reactive<{
  name: string
  symbol: string
  unitCategory: string
  isBaseUnit: boolean
  conversionFactor: number | null
  metadata: Record<string, unknown> | null
}>({ name: '', symbol: '', unitCategory: '', isBaseUnit: false, conversionFactor: null, metadata: null })

const openCreate = () => {
  editing.value = null
  Object.assign(form, { name: '', symbol: '', unitCategory: categoryFilter.value ?? '', isBaseUnit: false, conversionFactor: null, metadata: null })
  editDialog.value = true
}

const openEdit = (item: Unit) => {
  editing.value = item
  Object.assign(form, {
    name: item.name, symbol: item.symbol, unitCategory: item.unitCategory,
    isBaseUnit: item.isBaseUnit, conversionFactor: item.conversionFactor, metadata: item.metadata,
  })
  editDialog.value = true
}

const save = async () => {
  const body = { ...form }
  if (editing.value) await update(editing.value.id, body)
  else await create(body)
  editDialog.value = false
  await load()
}

const onDelete = async (item: Unit) => {
  if (!(await confirm({ title: 'Delete unit', message: `Delete "${item.name}"? This cannot be undone.`, color: 'error' }))) return
  await remove(item.id)
  await load()
}

const viewDialog = ref(false)
const viewing = ref<Unit | null>(null)

const openView = (item: Unit) => {
  viewing.value = item
  viewDialog.value = true
}

const viewFields = computed(() => viewing.value ? [
  { label: 'Name', value: viewing.value.name },
  { label: 'Symbol', value: viewing.value.symbol },
  { label: 'Category', value: viewing.value.unitCategory },
  { label: 'Base Unit', value: viewing.value.isBaseUnit },
  { label: 'Conversion Factor', value: viewing.value.conversionFactor },
  { label: 'Created', value: new Date(viewing.value.createdAt).toLocaleString() },
  { label: 'Updated', value: new Date(viewing.value.updatedAt).toLocaleString() },
] : [])
</script>

<template>
  <div>
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <h1 class="text-h5 font-weight-bold mr-auto">Units</h1>
      <v-select
        v-model="categoryFilter"
        :items="knownCategories"
        label="Category"
        clearable
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 160px;"
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
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">New Unit</v-btn>
    </div>

    <v-alert type="info" variant="tonal" density="compact" class="mb-4">
      Convert between two units in the same category via their base unit: valueInTarget = valueInSource
      × sourceFactor ÷ targetFactor. The base unit in each category has a conversion factor of 1.
    </v-alert>

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
      <template #item.isBaseUnit="{ item }">
        <v-icon v-if="item.isBaseUnit" icon="mdi-check" color="success" size="18" />
      </template>
    </CommonResourceTable>

    <CommonRecordViewDialog
      v-model="viewDialog"
      title="Unit Details"
      :fields="viewFields"
      :metadata="viewing?.metadata"
    />

    <v-dialog v-model="editDialog" max-width="420">
      <v-card rounded="lg">
        <v-card-title class="text-h6 pt-6 px-6">{{ editing ? 'Edit Unit' : 'New Unit' }}</v-card-title>
        <v-card-text class="px-6">
          <v-text-field v-model="form.name" label="Name" variant="outlined" density="comfortable" class="mb-2" />
          <v-row dense>
            <v-col cols="6">
              <v-text-field v-model="form.symbol" label="Symbol" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.unitCategory"
                label="Category"
                placeholder="mass, volume, length..."
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>
          <v-text-field v-model.number="form.conversionFactor" label="Conversion Factor" type="number" step="0.000001" variant="outlined" density="comfortable" class="mb-2" />
          <v-checkbox v-model="form.isBaseUnit" label="Base unit for this category" density="compact" hide-details class="mb-2" />
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
