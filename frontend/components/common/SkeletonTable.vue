<script setup lang="ts">
withDefaults(defineProps<{
  rows?: number
  columns?: number
}>(), {
  rows: 5,
  columns: 4,
})
</script>

<template>
  <v-table>
    <thead>
      <tr>
        <th v-for="c in columns" :key="c">
          <v-skeleton-loader type="text" width="80" />
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="r in rows" :key="r">
        <td v-for="c in columns" :key="c">
          <v-skeleton-loader type="text" :width="`${50 + Math.random() * 50}%`" />
        </td>
      </tr>
    </tbody>
  </v-table>
</template>
