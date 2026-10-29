<script setup lang="ts">
const { transition } = usePageTransition()
</script>

<template>
  <v-app>
    <NuxtLayout>
      <NuxtPage :transition="transition" />
    </NuxtLayout>
    <UiProvider />
  </v-app>
</template>

<style>
/* fade */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

/* slide */
.page-slide-enter-active,
.page-slide-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.page-slide-enter-from {
  transform: translateX(24px);
  opacity: 0;
}
.page-slide-leave-to {
  transform: translateX(-24px);
  opacity: 0;
}

/* fade-slide (default) */
.page-fade-slide-enter-active,
.page-fade-slide-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}
.page-fade-slide-enter-from {
  transform: translateY(10px);
  opacity: 0;
}
.page-fade-slide-leave-to {
  transform: translateY(-6px);
  opacity: 0;
}
</style>
