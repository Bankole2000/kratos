<script setup lang="ts">
// The app holds no screens of its own: the layout and the status screen come from packages/ui.
import { AppShell, StatusScreen } from 'ui'
</script>

<template>
  <AppShell>
    <StatusScreen />
  </AppShell>
</template>
