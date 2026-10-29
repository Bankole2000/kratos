<script setup lang="ts">
import { useApiKeyStore } from '~/stores/apiKey'

defineProps<{
  showMenuBtn?: boolean
  title?: string
}>()

defineEmits<{ (e: 'toggle-drawer'): void }>()

const apiKeyStore = useApiKeyStore()
const { theme, stored } = useAppTheme()

const themeIcon = computed(() => {
  if (stored.value === 'system') return 'mdi-theme-light-dark'
  return theme.value === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'
})

const themeTooltip = computed(() => {
  if (stored.value === 'system') return 'System theme (click for light)'
  return theme.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
})

const cycleTheme = () => {
  if (stored.value === 'light') stored.value = 'dark'
  else if (stored.value === 'dark') stored.value = 'system'
  else stored.value = 'light'
}

const keyDialog = ref(false)
const keyInput = ref('')

const openKeyDialog = () => {
  keyInput.value = apiKeyStore.key ?? ''
  keyDialog.value = true
}

const saveKey = () => {
  if (keyInput.value.trim()) apiKeyStore.setKey(keyInput.value.trim())
  keyDialog.value = false
}

const clearKey = () => {
  apiKeyStore.clearKey()
  keyDialog.value = false
}
</script>

<template>
  <v-app-bar elevation="0" border="b" scroll-behavior="fixed">
    <v-app-bar-nav-icon v-if="showMenuBtn" @click="$emit('toggle-drawer')" />

    <v-app-bar-title>
      <span class="font-weight-bold">Common Resources Admin</span>
      <span v-if="title" class="text-medium-emphasis font-weight-regular ml-2 text-body-1">
        / {{ title }}
      </span>
    </v-app-bar-title>

    <template #append>
      <v-tooltip :text="themeTooltip" location="bottom">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            :icon="themeIcon"
            variant="text"
            @click="cycleTheme"
          />
        </template>
      </v-tooltip>

      <v-btn
        variant="text"
        class="ml-1 mr-2"
        :prepend-icon="apiKeyStore.isSet ? 'mdi-key' : 'mdi-key-alert-outline'"
        :color="apiKeyStore.isSet ? undefined : 'warning'"
        @click="openKeyDialog"
      >
        <span class="text-body-2 d-none d-sm-inline">{{ apiKeyStore.isSet ? 'API key set' : 'Set API key' }}</span>
      </v-btn>
    </template>
  </v-app-bar>

  <v-dialog v-model="keyDialog" max-width="480">
    <v-card rounded="lg">
      <v-card-title class="text-h6 pt-6 px-6">Management server API key</v-card-title>
      <v-card-text class="px-6">
        <p class="text-body-2 text-medium-emphasis mb-4">
          Sent as the <code>x-api-key</code> header on every request to the NestJS management server.
          Issue one from the API Keys page using the bootstrap key seeded on first run.
        </p>
        <v-text-field
          v-model="keyInput"
          label="API key"
          placeholder="crs_..."
          variant="outlined"
          density="comfortable"
          autofocus
        />
      </v-card-text>
      <v-card-actions class="pa-4 pt-2">
        <v-btn v-if="apiKeyStore.isSet" variant="text" color="error" @click="clearKey">Clear key</v-btn>
        <v-spacer />
        <v-btn variant="text" @click="keyDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="tonal" @click="saveKey">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
