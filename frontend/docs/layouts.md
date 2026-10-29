# Layouts

Four layouts are available. All authenticated layouts share the same app bar and nav items via shared components.

## Available Layouts

| Layout | File | Use case |
|--------|------|----------|
| `default` | `layouts/default.vue` | Side drawer + top app bar. Persistent on desktop, collapsible on mobile. |
| `top-nav` | `layouts/top-nav.vue` | Horizontal nav links in the app bar. Collapses to a drawer on mobile. |
| `mini-rail` | `layouts/mini-rail.vue` | Icon-only rail that expands on hover. Collapses to a full drawer on mobile. |
| `blank` | `layouts/blank.vue` | Centered card shell. Used for auth pages. |

## Shared Components

| Component | Purpose |
|-----------|---------|
| `components/layout/AppBar.vue` | Top app bar with logo, page title, dark mode toggle, user avatar + dropdown |
| `components/layout/NavItems.vue` | Nav link list with section dividers. Accepts a `rail` prop to hide labels. |

## Using a Layout

Set the layout in `definePageMeta` on any page:

```vue
<script setup lang="ts">
definePageMeta({ layout: 'default' })   // side drawer
definePageMeta({ layout: 'top-nav' })   // top navigation
definePageMeta({ layout: 'mini-rail' }) // icon rail
definePageMeta({ layout: 'blank' })     // auth / minimal
</script>
```

`default` is used automatically if no layout is specified.

## Navigation Items

Nav items are defined in `components/layout/NavItems.vue`. To add or change links, edit the `navGroups` array:

```ts
const navGroups = [
  {
    items: [
      { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', to: '/' },
    ],
  },
  {
    label: 'Account',        // section divider label
    items: [
      { title: 'Profile', icon: 'mdi-account-outline', to: '/profile' },
      { title: 'Settings', icon: 'mdi-cog-outline', to: '/settings' },
    ],
  },
]
```

## App Bar

`AppBar.vue` accepts two props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showMenuBtn` | `boolean` | `false` | Shows the hamburger icon to toggle the drawer |
| `title` | `string` | — | Optional page title shown next to the logo |

The user avatar uses the first letter of `user.name` from the auth store. The dropdown includes Profile, Settings, and Sign out.

## Dark Mode

The app bar includes a dark/light toggle powered by `useAppTheme`. The selected theme is persisted to `localStorage` under the key `app:theme` and restored on next load.

```ts
const { theme, toggleTheme } = useAppTheme()
// theme.value → 'light' | 'dark'
```

## Responsive Behaviour

| Layout | Desktop | Mobile |
|--------|---------|--------|
| `default` | Persistent side drawer | Temporary overlay drawer, toggled via hamburger |
| `top-nav` | Inline nav links in app bar | Top-slide drawer toggled via hamburger |
| `mini-rail` | Icon-only rail, expands on hover | Temporary overlay drawer |
| `blank` | Centered column (sm=8, md=5, lg=4) | Full width |
