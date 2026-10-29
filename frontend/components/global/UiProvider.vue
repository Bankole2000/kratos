<script setup lang="ts">
import { useUiStore } from '~/stores/ui'

const ui = useUiStore()
const { _state, _accept, _cancel } = useConfirm()
const router = useRouter()

const navLoading = ref(false)

router.beforeEach(() => { navLoading.value = true })
router.afterEach(() => { navLoading.value = false })
</script>

<template>
  <div>
    <!-- Top progress bar for route navigation -->
    <v-progress-linear
      v-if="navLoading"
      indeterminate
      color="primary"
      height="3"
      style="position: fixed; top: 0; left: 0; right: 0; z-index: 9999;"
    />

    <!-- Full-screen overlay for manual async operations -->
    <v-overlay
      v-model="ui.loading"
      persistent
      class="align-center justify-center"
      z-index="9998"
    >
      <div class="text-center">
        <v-progress-circular indeterminate color="primary" size="56" />
        <p v-if="ui.overlayMessage" class="text-body-1 mt-4 text-white">{{ ui.overlayMessage }}</p>
      </div>
    </v-overlay>

    <!-- Toast queue -->
    <v-snackbar-queue
      v-model="ui.toasts"
      :location="ui.toastLocation"
      :total-visible="3"
      closable
    />

    <!-- Confirmation dialog -->
    <v-dialog v-model="_state.open" max-width="400" persistent>
      <v-card rounded="lg">
        <v-card-title v-if="_state.options.title" class="text-h6 pt-6 px-6">
          {{ _state.options.title }}
        </v-card-title>
        <v-card-text :class="_state.options.title ? 'px-6' : 'pt-6 px-6'">
          {{ _state.options.message }}
        </v-card-text>
        <v-card-actions class="pa-4 pt-2">
          <v-spacer />
          <v-btn variant="text" @click="_cancel">
            {{ _state.options.cancelText ?? 'Cancel' }}
          </v-btn>
          <v-btn
            :color="_state.options.color ?? 'primary'"
            variant="tonal"
            @click="_accept"
          >
            {{ _state.options.confirmText ?? 'Confirm' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
