<script setup lang="ts">
// Calls GET /health through the injected api client and shows the result. The request runs in
// onMounted, which never runs during a server render, so Nuxt renders the loading state and
// the browser fetches. The spinner also renders only after mount: Vuetify styles it from the
// browser's reduced-motion setting, which a server render cannot know, so rendering it on the
// server would make the two renders differ (a hydration mismatch).
import { computed, onMounted, shallowRef } from 'vue'
import { mdiAlertOutline, mdiCheckCircleOutline, mdiCloudOffOutline, mdiRefresh } from '@mdi/js'
import { useApiClient } from '../client.ts'
import { loadHealth, type HealthState } from '../health.ts'

const client = useApiClient()
const state = shallowRef<HealthState>({ kind: 'loading' })
const mounted = shallowRef(false)

async function check() {
  state.value = { kind: 'loading' }
  state.value = await loadHealth(client)
}

onMounted(() => {
  mounted.value = true
  void check()
})

const view = computed(() => {
  const s = state.value
  switch (s.kind) {
    case 'loading':
      return { title: 'Checking the api…', icon: null, color: undefined }
    case 'healthy':
      return { title: 'The api is healthy', icon: mdiCheckCircleOutline, color: 'success' }
    case 'unhealthy':
      return { title: 'The api is unhealthy', icon: mdiAlertOutline, color: 'warning' }
    case 'offline':
      return { title: 'Cannot reach the api', icon: mdiCloudOffOutline, color: 'error' }
  }
})
</script>

<template>
  <v-container class="platform-status" max-width="560">
    <v-card :data-state="state.kind" data-testid="status-screen" variant="flat" border>
      <v-card-item>
        <template #prepend>
          <template v-if="state.kind === 'loading'">
            <v-progress-circular v-if="mounted" indeterminate size="32" aria-label="Loading" />
            <span v-else class="platform-status__spinner-slot" aria-hidden="true" />
          </template>
          <v-icon v-else :icon="view.icon ?? undefined" :color="view.color" size="32" />
        </template>
        <v-card-title role="status" aria-live="polite" class="text-wrap">
          {{ view.title }}
        </v-card-title>
      </v-card-item>

      <v-card-text>
        <template v-if="state.kind === 'healthy'">
          <p>Database: up</p>
          <p data-testid="api-version">Api version {{ state.health.version }}</p>
        </template>
        <template v-else-if="state.kind === 'unhealthy'">
          <p data-testid="status-detail">{{ state.message }}</p>
          <p v-if="state.health" data-testid="api-version">
            Api version {{ state.health.version }}
          </p>
          <p v-if="state.requestId" class="text-medium-emphasis">
            Request ID {{ state.requestId }}
          </p>
        </template>
        <p v-else-if="state.kind === 'offline'" data-testid="status-detail">
          Check your connection and that the api is running, then try again.
        </p>
      </v-card-text>

      <v-card-actions>
        <v-btn
          :prepend-icon="mdiRefresh"
          :disabled="state.kind === 'loading'"
          variant="tonal"
          data-testid="retry"
          @click="check"
        >
          Retry
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<style scoped>
/* Holds the spinner's place until mount, so the card doesn't shift when it appears. */
.platform-status__spinner-slot {
  display: inline-block;
  width: 32px;
  height: 32px;
}
</style>
