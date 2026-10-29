<script setup lang="ts">
withDefaults(defineProps<{
  count?: number
  cols?: number
}>(), {
  count: 3,
  cols: 4,
})
</script>

<template>
  <v-row>
    <v-col
      v-for="i in count"
      :key="i"
      cols="12"
      :sm="Math.min(cols, 6)"
      :md="Math.max(12 / cols, 3)"
    >
      <v-skeleton-loader type="card" rounded="lg" />
    </v-col>
  </v-row>
</template>
