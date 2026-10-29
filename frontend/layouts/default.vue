<script setup lang="ts">
import { useDisplay } from 'vuetify'

const drawer = ref(true)
const { mobile } = useDisplay()

watch(mobile, (isMobile) => {
  drawer.value = !isMobile
}, { immediate: true })
</script>

<template>
  <div>
    <LayoutAppBar show-menu-btn @toggle-drawer="drawer = !drawer" />

    <v-navigation-drawer v-model="drawer" :temporary="mobile">
      <v-list-item
        title="Common Resources"
        prepend-icon="mdi-database-outline"
        nav
        class="py-4"
      />
      <v-divider />
      <v-list density="compact" nav class="mt-2">
        <LayoutNavItems />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid class="pa-6">
        <LayoutBreadcrumbs />
        <slot />
      </v-container>
    </v-main>
  </div>
</template>
