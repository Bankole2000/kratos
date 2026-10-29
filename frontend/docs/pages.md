# Pages

## Overview

| Page | File | Layout | Auth required |
|------|------|--------|---------------|
| Dashboard | `pages/index.vue` | `default` | Yes |
| Profile | `pages/profile.vue` | `default` | Yes |
| Settings | `pages/settings.vue` | `default` | Yes |
| Login | `pages/auth/login.vue` | `blank` | No |
| Register | `pages/auth/register.vue` | `blank` | No |
| Forgot Password | `pages/auth/forgot-password.vue` | `blank` | No |
| Reset Password | `pages/auth/reset-password.vue` | `blank` | No |
| Error / 404 | `error.vue` | standalone | No |

---

## Dashboard (`/`)

Demonstrates a typical app home page. All data is static — replace with real store calls.

**Sections:**
- **Welcome banner** — greeting with user name and quick action buttons (New Item, Export)
- **Stats cards** — 4 metric cards with icons, change indicators, and inline sparkline trend charts
- **Monthly Revenue chart** — bar sparkline with monthly labels
- **Recent Activity** — avatar list of the 5 latest events with timestamps
- **Users table** — `v-data-table` with status chips, sortable columns, edit/delete actions

**To connect real data:**
```ts
const posts = usePostsStore()
await posts.fetchAll()
// replace tableItems with posts.items
```

---

## Profile (`/profile`)

Simple profile edit page. Currently uses a simulated 1s delay — replace with a real API call.

**Sections:**
- Avatar card with initials and change button placeholder
- Name and email form

**To connect real API:**
```ts
const save = async () => {
  await useApiFetch('/users/me', { method: 'PATCH', body: form })
  toast.success('Profile updated.')
}
```

---

## Settings (`/settings`)

**Sections:**
- **Change Password** — current + new + confirm, with validation and password visibility toggles
- **Notifications** — 5 toggle switches (email updates, security alerts, marketing, weekly digest, activity summary)
- **Privacy & Security** — 3 toggles (public profile, analytics opt-in, two-factor auth)
- **Appearance** — dark/light mode toggle (wired to `useAppTheme`, persists to localStorage)
- **Quick Actions** sidebar — Export, Help, Sign out
- **Danger Zone** — Delete account with a confirmation dialog (`useConfirm`)

All toggles are local state — wire them to API calls or a settings store as needed.

---

## Error Page (`error.vue`)

Handles all Nuxt errors. Lives at the root (not inside `pages/`).

- **404** — shows a map search icon and "Page not found" message
- **Other errors** — shows an alert icon and the error message
- Both show a large translucent status code in the background
- Two buttons: **Go home** (clears the error and redirects to `/`) and **Go back**

The error page is standalone — it renders its own `<v-app>` and does not use any layout.
