import type { Breadcrumb } from '~/composables/useBreadcrumbs'

declare module '#app' {
  interface PageMeta {
    breadcrumbs?: Breadcrumb[]
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    breadcrumbs?: Breadcrumb[]
  }
}

export {}
