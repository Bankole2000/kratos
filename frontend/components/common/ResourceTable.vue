<script setup lang="ts">
interface Header {
  title: string
  key: string
  sortable?: boolean
  width?: string
}

const props = defineProps<{
  headers: Header[]
  items: any[]
  loading: boolean
  total: number
  page: number
  itemsPerPage: number
}>()

const emit = defineEmits<{
  (e: 'update:page', value: number): void
  (e: 'view', item: any): void
  (e: 'update', item: any): void
  (e: 'delete', item: any): void
}>()

const allHeaders = computed(() => [...props.headers, { title: '', key: 'actions', sortable: false, width: '56' }])
</script>

<template>
  <v-data-table-server
    :headers="allHeaders"
    :items="items"
    :items-length="total"
    :items-per-page="itemsPerPage"
    :loading="loading"
    :page="page"
    @update:page="emit('update:page', $event)"
  >
    <template v-for="header in headers" :key="header.key" #[`item.${header.key}`]="{ item }">
      <slot :name="`item.${header.key}`" :item="item">
        {{ item[header.key] }}
      </slot>
    </template>

    <template #item.actions="{ item }">
      <CommonRowActionsMenu
        @view="emit('view', item)"
        @update="emit('update', item)"
        @delete="emit('delete', item)"
      />
    </template>

    <template #no-data>
      <CommonEmptyState icon="mdi-database-off-outline" title="No records" message="No items match your filters." />
    </template>
  </v-data-table-server>
</template>
