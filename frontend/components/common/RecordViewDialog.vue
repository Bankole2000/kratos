<script setup lang="ts">
interface Field {
  label: string
  value: unknown
}

defineProps<{
  modelValue: boolean
  title: string
  fields: Field[]
  metadata?: Record<string, unknown> | null
}>()

defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="520" @update:model-value="$emit('update:modelValue', $event)">
    <v-card rounded="lg">
      <v-card-title class="text-h6 pt-6 px-6">{{ title }}</v-card-title>
      <v-card-text class="px-6">
        <v-table density="compact">
          <tbody>
            <tr v-for="field in fields" :key="field.label">
              <td class="text-medium-emphasis" style="width: 40%;">{{ field.label }}</td>
              <td>{{ formatValue(field.value) }}</td>
            </tr>
          </tbody>
        </v-table>

        <p class="text-body-2 font-weight-medium mt-4 mb-2">Metadata</p>
        <pre v-if="metadata" class="text-body-2 pa-3 rounded-lg" style="background: rgba(128,128,128,0.1); overflow-x: auto;">{{ JSON.stringify(metadata, null, 2) }}</pre>
        <p v-else class="text-body-2 text-medium-emphasis">No metadata set.</p>
      </v-card-text>
      <v-card-actions class="pa-4 pt-2">
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
