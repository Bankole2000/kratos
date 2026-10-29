<script setup lang="ts">
import type { Country } from '~/types/resources'

useSeo({ title: 'Countries' })

const { items, total, loading, list, create, update, remove } = useResourceCrud<Country>('/countries')
const { confirm } = useConfirm()

const page = ref(1)
const itemsPerPage = 25
const search = ref('')

const headers = [
  { title: 'Flag', key: 'flagEmoji', width: '64' },
  { title: 'Name', key: 'name' },
  { title: 'Alpha-2', key: 'alpha2', width: '100' },
  { title: 'Alpha-3', key: 'alpha3', width: '100' },
  { title: 'Calling Code', key: 'callingCode', width: '120' },
  { title: 'Region', key: 'region' },
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
const editing = ref<Country | null>(null)
const form = reactive({ name: '', alpha2: '', alpha3: '', callingCode: '', region: '', flagEmoji: '', metadata: null as Record<string, unknown> | null })

const openCreate = () => {
  editing.value = null
  Object.assign(form, { name: '', alpha2: '', alpha3: '', callingCode: '', region: '', flagEmoji: '', metadata: null })
  editDialog.value = true
}

const openEdit = (item: Country) => {
  editing.value = item
  Object.assign(form, {
    name: item.name, alpha2: item.alpha2, alpha3: item.alpha3,
    callingCode: item.callingCode, region: item.region, flagEmoji: item.flagEmoji, metadata: item.metadata,
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

const onDelete = async (item: Country) => {
  if (!(await confirm({ title: 'Delete country', message: `Delete "${item.name}"? This cannot be undone.`, color: 'error' }))) return
  await remove(item.id)
  await load()
}

const viewDialog = ref(false)
const viewing = ref<Country | null>(null)

const openView = (item: Country) => {
  viewing.value = item
  viewDialog.value = true
}

const viewFields = computed(() => viewing.value ? [
  { label: 'Flag', value: viewing.value.flagEmoji },
  { label: 'Name', value: viewing.value.name },
  { label: 'Alpha-2', value: viewing.value.alpha2 },
  { label: 'Alpha-3', value: viewing.value.alpha3 },
  { label: 'Calling Code', value: viewing.value.callingCode },
  { label: 'Region', value: viewing.value.region },
  { label: 'Created', value: new Date(viewing.value.createdAt).toLocaleString() },
  { label: 'Updated', value: new Date(viewing.value.updatedAt).toLocaleString() },
] : [])
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h5 font-weight-bold">Countries</h1>
      <v-spacer />
      <v-text-field
        v-model="search"
        placeholder="Search by name"
        prepend-inner-icon="mdi-magnify"
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 280px;"
        class="mr-3"
      />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">New Country</v-btn>
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
      <template #item.flagEmoji="{ item }">
        <span style="font-size: 1.4em;">{{ item.flagEmoji }}</span>
      </template>
    </CommonResourceTable>

    <CommonRecordViewDialog
      v-model="viewDialog"
      title="Country Details"
      :fields="viewFields"
      :metadata="viewing?.metadata"
    />

    <v-dialog v-model="editDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title class="text-h6 pt-6 px-6">{{ editing ? 'Edit Country' : 'New Country' }}</v-card-title>
        <v-card-text class="px-6">
          <v-text-field v-model="form.name" label="Name" variant="outlined" density="comfortable" class="mb-2" />
          <v-row dense>
            <v-col cols="6">
              <v-text-field v-model="form.alpha2" label="Alpha-2" maxlength="2" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="form.alpha3" label="Alpha-3" maxlength="3" variant="outlined" density="comfortable" />
            </v-col>
          </v-row>
          <v-text-field v-model="form.callingCode" label="Calling Code" variant="outlined" density="comfortable" class="mb-2" />
          <v-text-field v-model="form.region" label="Region" variant="outlined" density="comfortable" class="mb-2" />
          <v-text-field v-model="form.flagEmoji" label="Flag Emoji (optional, auto-derived if blank)" variant="outlined" density="comfortable" class="mb-2" />
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
