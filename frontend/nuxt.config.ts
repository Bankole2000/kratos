import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: ["@pinia/nuxt", "@vueuse/nuxt"],

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api",
      isDev: process.env.NODE_ENV !== "production",
    },
  },

  build: {
    transpile: ["vuetify"],
  },

  css: ["vuetify/styles"],

  vite: {
    plugins: [vuetify({ autoImport: true })],
    optimizeDeps: {
      include: ["@vue/devtools-core", "@vue/devtools-kit"],
    },
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },
});
