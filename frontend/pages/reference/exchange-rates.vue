<script setup lang="ts">
import type { ExchangeRate, ExchangeRateRefreshResult, Currency } from '~/types/resources'

useSeo({ title: 'Exchange Rates' })

const { items, total, loading, list, create, update, remove } = useResourceCrud<ExchangeRate>('/exchange-rates')
const { items: currencies, list: listCurrencies } = useResourceCrud<Currency>('/currencies')
const { confirm } = useConfirm()
const toast = useToast()
const { $api } = useNuxtApp()
const api = $api as typeof $fetch

const page = ref(1)
const itemsPerPage = 25
const baseFilter = ref<string | null>(null)
const quoteFilter = ref<string | null>(null)
const refreshing = ref(false)

const currencyLabel = (id: string | null) => {
  const c = currencies.value.find((x) => x.id === id)
  return c ? c.code : '—'
}

const headers = [
  { title: 'Base', key: 'baseCurrencyId', width: '100' },
  { title: 'Quote', key: 'quoteCurrencyId', width: '100' },
  { title: 'Rate', key: 'rate', width: '140' },
  { title: 'Source', key: 'source', width: '160' },
  { title: 'Fetched At', key: 'fetchedAt', width: '180' },
]

const load = () => list({
  limit: itemsPerPage,
  offset: (page.value - 1) * itemsPerPage,
  baseCurrencyId: baseFilter.value || undefined,
  quoteCurrencyId: quoteFilter.value || undefined,
})

watch(page, load)
watch([baseFilter, quoteFilter], () => { page.value = 1; load() })
onMounted(async () => {
  await listCurrencies({ limit: 300 })
  await load()
})

const refresh = async () => {
  refreshing.value = true
  try {
    const result = await api<ExchangeRateRefreshResult>('/exchange-rates/refresh', { method: 'POST' })
    toast.success(`Refreshed ${result.updated} rates from ${result.source}`)
    await load()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    toast.error(err?.data?.message ?? err?.message ?? 'Refresh failed')
  } finally {
    refreshing.value = false
  }
}

const editDialog = ref(false)
const editing = ref<ExchangeRate | null>(null)
const form = reactive<{
  baseCurrencyId: string | null
  quoteCurrencyId: string | null
  rate: number | null
  metadata: Record<string, unknown> | null
}>({ baseCurrencyId: null, quoteCurrencyId: null, rate: null, metadata: null })

const openCreate = () => {
  editing.value = null
  Object.assign(form, { baseCurrencyId: baseFilter.value, quoteCurrencyId: null, rate: null, metadata: null })
  editDialog.value = true
}

const openEdit = (item: ExchangeRate) => {
  editing.value = item
  Object.assign(form, {
    baseCurrencyId: item.baseCurrencyId, quoteCurrencyId: item.quoteCurrencyId,
    rate: item.rate, metadata: item.metadata,
  })
  editDialog.value = true
}

const save = async () => {
  const body: Record<string, unknown> = {
    baseCurrencyId: form.baseCurrencyId,
    quoteCurrencyId: form.quoteCurrencyId,
    rate: form.rate,
    metadata: form.metadata,
  }
  if (editing.value) await update(editing.value.id, body)
  else await create(body)
  editDialog.value = false
  await load()
}

const onDelete = async (item: ExchangeRate) => {
  if (!(await confirm({
    title: 'Delete exchange rate',
    message: `Delete the ${currencyLabel(item.baseCurrencyId)} → ${currencyLabel(item.quoteCurrencyId)} rate? This cannot be undone.`,
    color: 'error',
  }))) return
  await remove(item.id)
  await load()
}

const viewDialog = ref(false)
const viewing = ref<ExchangeRate | null>(null)

const openView = (item: ExchangeRate) => {
  viewing.value = item
  viewDialog.value = true
}

const viewFields = computed(() => viewing.value ? [
  { label: 'Base Currency', value: currencyLabel(viewing.value.baseCurrencyId) },
  { label: 'Quote Currency', value: currencyLabel(viewing.value.quoteCurrencyId) },
  { label: 'Rate', value: viewing.value.rate },
  { label: 'Source', value: viewing.value.source },
  { label: 'Fetched At', value: new Date(viewing.value.fetchedAt).toLocaleString() },
  { label: 'Created', value: new Date(viewing.value.createdAt).toLocaleString() },
  { label: 'Updated', value: new Date(viewing.value.updatedAt).toLocaleString() },
] : [])
</script>

<template>
  <div>
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <h1 class="text-h5 font-weight-bold mr-auto">Exchange Rates</h1>
      <v-select
        v-model="baseFilter"
        :items="currencies"
        item-title="code"
        item-value="id"
        label="Base"
        clearable
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 140px;"
      />
      <v-select
        v-model="quoteFilter"
        :items="currencies"
        item-title="code"
        item-value="id"
        label="Quote"
        clearable
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 140px;"
      />
      <v-btn variant="tonal" prepend-icon="mdi-refresh" :loading="refreshing" @click="refresh">
        Refresh from Provider
      </v-btn>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">New Rate</v-btn>
    </div>

    <v-alert type="info" variant="tonal" density="compact" class="mb-4">
      "Refresh from Provider" pulls USD-based rates for fiat currencies from exchangerate-api.com and overwrites
      matching pairs. Latest-only — no history is kept, so this reflects the rate as of the last refresh, not a
      point-in-time record.
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
      <template #item.baseCurrencyId="{ item }">{{ currencyLabel(item.baseCurrencyId) }}</template>
      <template #item.quoteCurrencyId="{ item }">{{ currencyLabel(item.quoteCurrencyId) }}</template>
      <template #item.source="{ item }">
        <v-chip size="small" :color="item.source === 'manual' ? 'default' : 'primary'" variant="tonal">
          {{ item.source }}
        </v-chip>
      </template>
      <template #item.fetchedAt="{ item }">
        {{ new Date(item.fetchedAt).toLocaleString() }}
      </template>
    </CommonResourceTable>

    <CommonRecordViewDialog
      v-model="viewDialog"
      title="Exchange Rate Details"
      :fields="viewFields"
      :metadata="viewing?.metadata"
    />

    <v-dialog v-model="editDialog" max-width="420">
      <v-card rounded="lg">
        <v-card-title class="text-h6 pt-6 px-6">{{ editing ? 'Edit Exchange Rate' : 'New Exchange Rate' }}</v-card-title>
        <v-card-text class="px-6">
          <v-row dense>
            <v-col cols="6">
              <v-select
                v-model="form.baseCurrencyId"
                :items="currencies"
                item-title="code"
                item-value="id"
                label="Base Currency"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="form.quoteCurrencyId"
                :items="currencies"
                item-title="code"
                item-value="id"
                label="Quote Currency"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>
          <v-text-field v-model.number="form.rate" label="Rate" type="number" step="0.000001" variant="outlined" density="comfortable" class="mb-2" />
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
