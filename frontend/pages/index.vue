<script setup lang="ts">
useSeo({ title: 'Dashboard' })

const apiKeyStore = useApiKeyStore()
const { $api } = useNuxtApp()
const api = $api as typeof $fetch

interface ResourceCard {
  title: string
  to: string
  icon: string
  count: Ref<number | null>
  path: string
}

const makeCard = (title: string, to: string, icon: string, path: string): ResourceCard => ({
  title, to, icon, path, count: ref(null),
})

const syncCards = [
  makeCard('Countries', '/reference/countries', 'mdi-earth', '/countries'),
  makeCard('Provinces', '/reference/provinces', 'mdi-map-outline', '/provinces'),
  makeCard('Cities', '/reference/cities', 'mdi-city-variant-outline', '/cities'),
  makeCard('Currencies', '/reference/currencies', 'mdi-cash-multiple', '/currencies'),
  makeCard('Exchange Rates', '/reference/exchange-rates', 'mdi-currency-usd', '/exchange-rates'),
  makeCard('Timezones', '/reference/timezones', 'mdi-clock-outline', '/timezones'),
  makeCard('Languages', '/reference/languages', 'mdi-translate', '/languages'),
  makeCard('Units', '/reference/units', 'mdi-ruler', '/units'),
]

const orgCards = [
  makeCard('Companies', '/org/companies', 'mdi-domain', '/companies'),
  makeCard('Banks', '/org/banks', 'mdi-bank-outline', '/banks'),
  makeCard('Vendors', '/org/vendors', 'mdi-storefront-outline', '/vendors'),
  makeCard('Category Groups', '/org/category-groups', 'mdi-folder-multiple-outline', '/category-groups'),
  makeCard('Categories', '/org/categories', 'mdi-shape-outline', '/categories'),
  makeCard('Industries', '/org/industries', 'mdi-factory', '/industries'),
  makeCard('Locations', '/org/locations', 'mdi-map-marker-outline', '/locations'),
  makeCard('Tags', '/org/tags', 'mdi-tag-outline', '/tags'),
]

const loadCounts = async () => {
  if (!apiKeyStore.isSet) return
  await Promise.all(
    [...syncCards, ...orgCards].map(async (card) => {
      try {
        const result = await api<{ total: number }>(card.path, { query: { limit: 1 } })
        card.count.value = result.total
      } catch {
        card.count.value = null
      }
    }),
  )
}

onMounted(loadCounts)
watch(() => apiKeyStore.isSet, (set) => { if (set) loadCounts() })
</script>

<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-1">Common Resources Server — Admin</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">
      Browse and manage reference data and org-curated resource lists. Backed by the NestJS management server's admin write API.
    </p>

    <v-alert v-if="!apiKeyStore.isSet" type="warning" variant="tonal" class="mb-6">
      No API key set. Set one from the button in the top bar before browsing or editing data.
    </v-alert>

    <h2 class="text-subtitle-1 font-weight-bold mb-3">Reference Data</h2>
    <v-row class="mb-6">
      <v-col v-for="card in syncCards" :key="card.to" cols="12" sm="6" md="3">
        <v-card :to="card.to" rounded="lg" hover>
          <v-card-item>
            <template #prepend>
              <v-icon :icon="card.icon" size="28" color="primary" />
            </template>
            <v-card-title class="text-body-1">{{ card.title }}</v-card-title>
            <v-card-subtitle>{{ card.count.value ?? '—' }} items</v-card-subtitle>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>

    <h2 class="text-subtitle-1 font-weight-bold mb-3">Org-Curated Lists</h2>
    <v-row class="mb-6">
      <v-col v-for="card in orgCards" :key="card.to" cols="12" sm="6" md="3">
        <v-card :to="card.to" rounded="lg" hover>
          <v-card-item>
            <template #prepend>
              <v-icon :icon="card.icon" size="28" color="primary" />
            </template>
            <v-card-title class="text-body-1">{{ card.title }}</v-card-title>
            <v-card-subtitle>{{ card.count.value ?? '—' }} items</v-card-subtitle>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>

    <v-card to="/api-keys" rounded="lg" hover class="mb-6" max-width="320">
      <v-card-item>
        <template #prepend>
          <v-icon icon="mdi-key-outline" size="28" color="primary" />
        </template>
        <v-card-title class="text-body-1">API Keys</v-card-title>
        <v-card-subtitle>Manage project access</v-card-subtitle>
      </v-card-item>
    </v-card>
  </div>
</template>
