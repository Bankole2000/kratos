// Entry point of the desktop and mobile app. Everything on screen comes from packages/ui;
// this file only installs it with the api address for this build.
import { createApp } from 'vue'
import { createPlatformUi } from 'ui'
import App from './App.vue'
import { apiBaseUrl } from './config'

createApp(App)
  .use(createPlatformUi({ apiBaseUrl: apiBaseUrl(import.meta.env) }))
  .mount('#app')
