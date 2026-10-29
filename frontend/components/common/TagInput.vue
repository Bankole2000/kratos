<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: string[]
  label?: string
  placeholder?: string
  maxTags?: number
  allowDuplicates?: boolean
  delimiters?: string[]
}>(), {
  modelValue: () => [],
  label: 'Tags',
  placeholder: 'Add a tag…',
  maxTags: 20,
  allowDuplicates: false,
  delimiters: () => ['Enter', ','],
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const input = ref('')
const inputRef = ref<HTMLInputElement>()

const addTag = (raw: string) => {
  const tag = raw.trim().replace(/,$/, '')
  if (!tag) return
  if (!props.allowDuplicates && props.modelValue.includes(tag)) {
    input.value = ''
    return
  }
  if (props.modelValue.length >= props.maxTags) return
  emit('update:modelValue', [...props.modelValue, tag])
  input.value = ''
}

const removeTag = (index: number) => {
  const next = [...props.modelValue]
  next.splice(index, 1)
  emit('update:modelValue', next)
}

const onKeydown = (e: KeyboardEvent) => {
  if (props.delimiters.includes(e.key)) {
    e.preventDefault()
    addTag(input.value)
    return
  }
  if (e.key === 'Backspace' && !input.value && props.modelValue.length) {
    removeTag(props.modelValue.length - 1)
  }
}

const onBlur = () => {
  if (input.value.trim()) addTag(input.value)
}
</script>

<template>
  <div>
    <label v-if="label" class="text-caption text-medium-emphasis d-block mb-1">{{ label }}</label>
    <div
      class="tag-input-wrapper rounded-lg pa-2 d-flex flex-wrap align-center ga-1"
      @click="inputRef?.focus()"
    >
      <v-chip
        v-for="(tag, i) in modelValue"
        :key="i"
        size="small"
        color="primary"
        variant="tonal"
        closable
        @click:close="removeTag(i)"
      >
        {{ tag }}
      </v-chip>
      <input
        ref="inputRef"
        v-model="input"
        class="tag-input-field text-body-2"
        :placeholder="modelValue.length === 0 ? placeholder : ''"
        :disabled="modelValue.length >= maxTags"
        @keydown="onKeydown"
        @blur="onBlur"
      />
    </div>
    <p class="text-caption text-medium-emphasis mt-1">
      {{ modelValue.length }}/{{ maxTags }} — press Enter or comma to add
    </p>
  </div>
</template>

<style scoped>
.tag-input-wrapper {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  cursor: text;
  min-height: 44px;
  transition: border-color 0.2s;
}
.tag-input-wrapper:focus-within {
  border-color: rgb(var(--v-theme-primary));
}
.tag-input-field {
  border: none;
  outline: none;
  background: transparent;
  color: inherit;
  flex: 1;
  min-width: 120px;
  font-size: 0.875rem;
}
</style>
