<script setup lang="ts">
import type { Currency, CurrencyKind } from '~/types/resources'

useSeo({ title: 'Currencies' })

const { items, total, loading, list, create, update, remove } = useResourceCrud<Currency>('/currencies')
const { confirm } = useConfirm()

const page = ref(1)
const itemsPerPage = 25
const search = ref('')
const kindFilter = ref<CurrencyKind | null>(null)

const kindOptions: { title: string; value: CurrencyKind }[] = [
  { title: 'Fiat', value: 'FIAT' },
  { title: 'Crypto', value: 'CRYPTO' },
  { title: 'In-Game', value: 'IN_GAME' },
]

const kindColor = (kind: CurrencyKind) =>
  kind === 'FIAT' ? 'primary' : kind === 'CRYPTO' ? 'warning' : 'success'

const kindLabel = (kind: CurrencyKind) => kindOptions.find((o) => o.value === kind)?.title ?? kind

const headers = [
  { title: 'Code', key: 'code', width: '110' },
  { title: 'Name', key: 'name' },
  { title: 'Symbol', key: 'symbol', width: '90' },
  { title: 'Kind', key: 'kind', width: '110' },
  { title: 'Decimal Digits', key: 'decimalDigits', width: '140' },
]

const load = () => list({
  limit: itemsPerPage,
  offset: (page.value - 1) * itemsPerPage,
  search: search.value || undefined,
  kind: kindFilter.value || undefined,
})

watch(page, load)
watch([search, kindFilter], () => { page.value = 1; load() })
onMounted(load)

const editDialog = ref(false)
const editing = ref<Currency | null>(null)
const form = reactive<{
  code: string
  name: string
  symbol: string
  decimalDigits: number
  kind: CurrencyKind
  metadata: Record<string, unknown> | null
}>({ code: '', name: '', symbol: '', decimalDigits: 2, kind: 'FIAT', metadata: null })

const openCreate = () => {
  editing.value = null
  Object.assign(form, { code: '', name: '', symbol: '', decimalDigits: 2, kind: kindFilter.value ?? 'FIAT', metadata: null })
  editDialog.value = true
}

const openEdit = (item: Currency) => {
  editing.value = item
  Object.assign(form, {
    code: item.code, name: item.name, symbol: item.symbol,
    decimalDigits: item.decimalDigits, kind: item.kind, metadata: item.metadata,
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

const onDelete = async (item: Currency) => {
  if (!(await confirm({ title: 'Delete currency', message: `Delete "${item.name}"? This cannot be undone.`, color: 'error' }))) return
  await remove(item.id)
  await load()
}

const viewDialog = ref(false)
const viewing = ref<Currency | null>(null)

const openView = (item: Currency) => {
  viewing.value = item
  viewDialog.value = true
}

const viewFields = computed(() => viewing.value ? [
  { label: 'Code', value: viewing.value.code },
  { label: 'Name', value: viewing.value.name },
  { label: 'Symbol', value: viewing.value.symbol },
  { label: 'Kind', value: kindLabel(viewing.value.kind) },
  { label: 'Decimal Digits', value: viewing.value.decimalDigits },
  { label: 'Created', value: new Date(viewing.value.createdAt).toLocaleString() },
  { label: 'Updated', value: new Date(viewing.value.updatedAt).toLocaleString() },
] : [])
</script>

<template>
  <div>
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <h1 class="text-h5 font-weight-bold mr-auto">Currencies</h1>
      <v-select
        v-model="kindFilter"
        :items="kindOptions"
        label="Kind"
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
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">New Currency</v-btn>
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
      <template #item.kind="{ item }">
        <v-chip size="small" :color="kindColor(item.kind)" variant="tonal">{{ kindLabel(item.kind) }}</v-chip>
      </template>
    </CommonResourceTable>

    <CommonRecordViewDialog
      v-model="viewDialog"
      title="Currency Details"
      :fields="viewFields"
      :metadata="viewing?.metadata"
    />

    <v-dialog v-model="editDialog" max-width="420">
      <v-card rounded="lg">
        <v-card-title class="text-h6 pt-6 px-6">{{ editing ? 'Edit Currency' : 'New Currency' }}</v-card-title>
        <v-card-text class="px-6">
          <v-text-field v-model="form.code" label="Code" variant="outlined" density="comfortable" class="mb-2" />
          <v-text-field v-model="form.name" label="Name" variant="outlined" density="comfortable" class="mb-2" />
          <v-row dense>
            <v-col cols="6">
              <v-text-field v-model="form.symbol" label="Symbol" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model.number="form.decimalDigits" label="Decimal Digits" type="number" variant="outlined" density="comfortable" />
            </v-col>
          </v-row>
          <v-select
            v-model="form.kind"
            :items="kindOptions"
            label="Kind"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />
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
