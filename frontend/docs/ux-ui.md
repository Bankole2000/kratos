# UX & UI Patterns

## Breadcrumbs

Auto-generated from the URL path. Any page can override them via `definePageMeta`.

### Auto mode

`composables/useBreadcrumbs.ts` splits `route.path` into segments and maps each to a human-readable label. Labels are resolved from a built-in map; unknown segments are title-cased automatically (e.g. `order-history` → `Order History`).

The breadcrumb is rendered by `components/layout/Breadcrumbs.vue` and is mounted in every app layout (`default`, `top-nav`, `mini-rail`) above the page slot. It hides itself when there is only one crumb (i.e. on the home page).

### Manual override

```ts
definePageMeta({
  breadcrumbs: [
    { title: 'Home', to: '/' },
    { title: 'Orders', to: '/orders' },
    { title: 'Order #1042', disabled: true },
  ],
})
```

The `Breadcrumb` type is exported from `composables/useBreadcrumbs.ts`:

```ts
interface Breadcrumb {
  title: string
  to?: string
  disabled?: boolean
}
```

TypeScript recognises `breadcrumbs` in `definePageMeta` via `types/nuxt.d.ts`.

---

## Page Transitions

`composables/usePageTransition.ts` exposes a module-level reactive transition name. `app.vue` binds it to `<NuxtPage :transition>` so the active transition applies across all route changes.

### Available transitions

| Name | Description |
|------|-------------|
| `fade-slide` | Fade + subtle vertical slide (default) |
| `fade` | Opacity cross-fade only |
| `slide` | Horizontal slide left/right |
| `none` | No animation |

### Changing at runtime

```ts
const { setTransition, currentTransition } = usePageTransition()

setTransition('slide')
```

Can be called from any component or page — the change takes effect on the next navigation.

### CSS classes

The transition CSS lives in `app.vue` `<style>` block. Each transition name maps to a `.page-{name}-enter-active` / `.page-{name}-leave-active` pair. Add new ones following the same pattern.

---

## Empty State

`components/common/EmptyState.vue` — a centred placeholder for zero-data scenarios.

### Props

| Prop | Type | Default |
|------|------|---------|
| `icon` | `string` | `mdi-inbox-outline` |
| `title` | `string` | `Nothing here` |
| `message` | `string` | `No items to display.` |
| `color` | `string` | `medium-emphasis` |

### Slot

The default slot renders below the message. Use it for action buttons:

```vue
<CommonEmptyState
  icon="mdi-magnify"
  title="No results"
  message="Try adjusting your filters."
  color="warning"
>
  <v-btn variant="tonal" color="warning" @click="clearFilters">Clear filters</v-btn>
</CommonEmptyState>
```

---

## Skeleton Loaders

Three wrapper components around Vuetify's `v-skeleton-loader`. Swap them in while data is loading and replace with real content once the request resolves.

### SkeletonCard

```vue
<CommonSkeletonCard v-if="loading" :count="3" :cols="3" />
<RealCardGrid v-else :items="items" />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `count` | `number` | `3` | Number of placeholder cards |
| `cols` | `number` | `4` | Cards per row (determines responsive column widths) |

### SkeletonList

```vue
<CommonSkeletonList v-if="loading" :count="5" />
<MyList v-else :items="items" />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `count` | `number` | `5` | Number of skeleton rows |
| `avatar` | `boolean` | `true` | Include avatar placeholder on each row |

### SkeletonTable

```vue
<CommonSkeletonTable v-if="loading" :rows="6" :columns="4" />
<v-data-table v-else :items="items" :headers="headers" />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rows` | `number` | `5` | Number of body rows |
| `columns` | `number` | `4` | Number of columns |
