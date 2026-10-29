<script setup lang="ts">
const { crumbs } = useBreadcrumbs()
</script>

<template>
  <v-breadcrumbs
    v-if="crumbs.length > 1"
    :items="crumbs"
    density="compact"
    class="px-0 py-2"
  >
    <template #divider>
      <v-icon icon="mdi-chevron-right" size="16" />
    </template>
    <template #title="{ item }">
      <span :class="item.disabled ? 'text-medium-emphasis' : 'text-primary'" class="text-body-2">
        {{ item.title }}
      </span>
    </template>
  </v-breadcrumbs>
</template>
