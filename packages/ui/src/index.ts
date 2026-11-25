// Public API of the shared UI package, used by apps/web and apps/app. Import only from 'ui',
// never from files inside it.
export { createPlatformUi, type PlatformUiOptions } from './plugin.ts'
export { useApiClient, apiClientKey } from './client.ts'
export { default as AppShell } from './components/AppShell.vue'
export { default as StatusScreen } from './components/StatusScreen.vue'
export { defaultNavItems, type NavItem } from './navigation.ts'
export { lightTheme, darkTheme, narrowBreakpoint } from './theme.ts'
export type { HealthState } from './health.ts'
