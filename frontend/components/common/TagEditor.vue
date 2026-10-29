<script setup lang="ts">
const props = defineProps<{
  basePath: string
  entityId: string | undefined
}>()

const entityIdRef = toRef(props, 'entityId')
const { tags, loading, load, attach, detach } = useTagAssignments(props.basePath, entityIdRef)

watch(entityIdRef, () => { load() }, { immediate: true })

const newTagName = ref('')
const attaching = ref(false)

const addTag = async () => {
  const name = newTagName.value.trim()
  if (!name) return
  attaching.value = true
  try {
    await attach({ name })
    newTagName.value = ''
  } finally {
    attaching.value = false
  }
}
</script>

<template>
  <div>
    <div class="d-flex flex-wrap ga-2 mb-3">
      <v-chip
        v-for="tag in tags"
        :key="tag.id"
        closable
        size="small"
        @click:close="detach(tag.id)"
      >
        {{ tag.name }}
      </v-chip>
      <span v-if="!loading && tags.length === 0" class="text-body-2 text-medium-emphasis">No tags yet.</span>
    </div>
    <v-text-field
      v-model="newTagName"
      density="compact"
      variant="outlined"
      placeholder="Add tag by name"
      hide-details
      :loading="attaching"
      @keyup.enter="addTag"
    >
      <template #append-inner>
        <v-btn size="small" variant="text" icon="mdi-plus" :disabled="!newTagName.trim()" @click="addTag" />
      </template>
    </v-text-field>
  </div>
</template>
