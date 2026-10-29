<script setup lang="ts">
defineProps<{ rail?: boolean }>()

const navGroups = [
  {
    items: [
      { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', to: '/' },
    ],
  },
  {
    label: 'Reference Data',
    items: [
      { title: 'Countries', icon: 'mdi-earth', to: '/reference/countries' },
      { title: 'Provinces', icon: 'mdi-map-outline', to: '/reference/provinces' },
      { title: 'Cities', icon: 'mdi-city-variant-outline', to: '/reference/cities' },
      { title: 'Currencies', icon: 'mdi-cash-multiple', to: '/reference/currencies' },
      { title: 'Exchange Rates', icon: 'mdi-currency-usd', to: '/reference/exchange-rates' },
      { title: 'Timezones', icon: 'mdi-clock-outline', to: '/reference/timezones' },
      { title: 'Languages', icon: 'mdi-translate', to: '/reference/languages' },
      { title: 'Units', icon: 'mdi-ruler', to: '/reference/units' },
    ],
  },
  {
    label: 'Org-Curated',
    items: [
      { title: 'Companies', icon: 'mdi-domain', to: '/org/companies' },
      { title: 'Banks', icon: 'mdi-bank-outline', to: '/org/banks' },
      { title: 'Vendors', icon: 'mdi-storefront-outline', to: '/org/vendors' },
      { title: 'Category Groups', icon: 'mdi-folder-multiple-outline', to: '/org/category-groups' },
      { title: 'Categories', icon: 'mdi-shape-outline', to: '/org/categories' },
      { title: 'Industries', icon: 'mdi-factory', to: '/org/industries' },
      { title: 'Locations', icon: 'mdi-map-marker-outline', to: '/org/locations' },
      { title: 'Tags', icon: 'mdi-tag-outline', to: '/org/tags' },
    ],
  },
  {
    label: 'Access',
    items: [
      { title: 'Projects', icon: 'mdi-application-outline', to: '/projects' },
      { title: 'Templates', icon: 'mdi-email-outline', to: '/templates' },
      { title: 'API Keys', icon: 'mdi-key-outline', to: '/api-keys' },
    ],
  },
]
</script>

<template>
  <template v-for="(group, gi) in navGroups" :key="gi">
    <v-divider v-if="gi > 0" class="my-2" />
    <v-list-subheader v-if="group.label && !rail">{{ group.label }}</v-list-subheader>
    <v-list-item
      v-for="item in group.items"
      :key="item.to"
      :to="item.to"
      :prepend-icon="item.icon"
      :title="rail ? undefined : item.title"
      :value="item.to"
      rounded="lg"
      active-class="text-primary"
    >
      <v-tooltip v-if="rail" activator="parent" location="end">{{ item.title }}</v-tooltip>
    </v-list-item>
  </template>
</template>
