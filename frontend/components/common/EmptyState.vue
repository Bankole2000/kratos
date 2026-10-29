<script setup lang="ts">
withDefaults(defineProps<{
  icon?: string
  title?: string
  message?: string
  color?: string
}>(), {
  icon: 'mdi-inbox-outline',
  title: 'Nothing here',
  message: 'No items to display.',
  color: 'medium-emphasis',
})
</script>

<template>
  <div class="d-flex flex-column align-center justify-center text-center py-12 px-4">
    <v-icon :icon="icon" :color="color" size="56" class="mb-4" style="opacity: 0.4;" />
    <p class="text-body-1 font-weight-bold mb-1">{{ title }}</p>
    <p class="text-body-2 text-medium-emphasis mb-6" style="max-width: 320px;">{{ message }}</p>
    <slot />
  </div>
</template>
