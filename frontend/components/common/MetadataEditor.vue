<script setup lang="ts">
const props = defineProps<{ modelValue: Record<string, unknown> | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: Record<string, unknown> | null): void }>()

const text = ref(props.modelValue ? JSON.stringify(props.modelValue, null, 2) : '')
const error = ref('')

watch(() => props.modelValue, (v) => {
  text.value = v ? JSON.stringify(v, null, 2) : ''
})

const onInput = (value: string) => {
  text.value = value
  if (!value.trim()) {
    error.value = ''
    emit('update:modelValue', null)
    return
  }
  try {
    const parsed = JSON.parse(value)
    error.value = ''
    emit('update:modelValue', parsed)
  } catch {
    error.value = 'Invalid JSON'
  }
}
</script>

<template>
  <v-textarea
    :model-value="text"
    label="Metadata (JSON)"
    variant="outlined"
    rows="4"
    :error-messages="error ? [error] : []"
    @update:model-value="onInput"
  />
</template>
