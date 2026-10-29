<script setup lang="ts">
defineEmits<{
  (e: 'view'): void
  (e: 'update'): void
  (e: 'delete'): void
}>()
</script>

<template>
  <v-menu location="bottom end">
    <template #activator="{ props }">
      <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" size="small" />
    </template>
    <v-list density="compact" nav>
      <v-list-item prepend-icon="mdi-eye-outline" title="View" rounded="lg" @click="$emit('view')" />
      <v-list-item prepend-icon="mdi-pencil-outline" title="Update" rounded="lg" @click="$emit('update')" />
      <v-list-item prepend-icon="mdi-delete-outline" title="Delete" rounded="lg" base-color="error" @click="$emit('delete')" />
    </v-list>
  </v-menu>
</template>
