<script setup lang="ts">
// The layout shell of every screen (DESIGN.md, Platforms and navigation): a side navigation
// rail at 600 px and wider, a bottom navigation bar below that. Destinations are plain items
// until routing exists; the host app listens to `v-model` to switch pages.
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import { defaultNavItems, type NavItem } from '../navigation.ts'
import { narrowBreakpoint, railWidth } from '../theme.ts'

const props = withDefaults(
  defineProps<{
    /** Navigation destinations; defaults to Portfolio, Reference data, Tokens and Settings. */
    items?: readonly NavItem[]
    /** Title in the top bar. */
    title?: string
  }>(),
  { items: () => defaultNavItems, title: 'Platform Core' },
)

/** The `value` of the active destination; defaults to the first item. */
const active = defineModel<string>()

const { width } = useDisplay()
/** Narrow screens (phones) get the bottom bar; everything wider gets the rail. */
const narrow = computed(() => width.value < narrowBreakpoint)
const current = computed(() => active.value ?? props.items[0]?.value)

function select(item: NavItem) {
  active.value = item.value
}
</script>

<template>
  <v-app class="platform-shell">
    <v-app-bar :elevation="0" border="b" density="comfortable">
      <v-app-bar-title>{{ title }}</v-app-bar-title>
    </v-app-bar>

    <v-navigation-drawer
      v-if="!narrow"
      permanent
      :width="railWidth"
      data-testid="nav-rail"
      aria-label="Main navigation"
      tag="nav"
    >
      <div class="d-flex flex-column ga-1 pa-2">
        <v-btn
          v-for="item in items"
          :key="item.value"
          :prepend-icon="item.icon"
          :active="item.value === current"
          :aria-current="item.value === current ? 'page' : undefined"
          class="platform-shell__rail-item"
          variant="text"
          stacked
          block
          size="small"
          @click="select(item)"
        >
          <span class="platform-shell__label">{{ item.title }}</span>
        </v-btn>
      </div>
    </v-navigation-drawer>

    <v-main class="platform-shell__main">
      <slot />
    </v-main>

    <v-bottom-navigation
      v-if="narrow"
      :model-value="current"
      grow
      data-testid="nav-bottom"
      aria-label="Main navigation"
      tag="nav"
    >
      <v-btn
        v-for="item in items"
        :key="item.value"
        :value="item.value"
        :aria-label="item.title"
        :aria-current="item.value === current ? 'page' : undefined"
        class="platform-shell__bottom-item"
        @click="select(item)"
      >
        <v-icon :icon="item.icon" />
        <span class="platform-shell__label">{{ item.title }}</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<style scoped>
/* Never scroll sideways, down to the 360 px minimum width (NFR-007). */
.platform-shell__main {
  min-width: 0;
  overflow-x: hidden;
}

.platform-shell__rail-item {
  min-height: 56px;
}

/* Bottom bar buttons share the width evenly and may shrink; labels wrap instead of overflowing. */
.platform-shell__bottom-item {
  min-width: 0;
  flex: 1 1 0;
}

.platform-shell__label {
  font-size: 0.75rem;
  line-height: 1.1;
  white-space: normal;
  text-align: center;
  overflow-wrap: anywhere;
}
</style>
