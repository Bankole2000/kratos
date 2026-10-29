# Global UX Patterns

All global UI state lives in `stores/ui.ts` and is mounted once via `components/global/UiProvider.vue` in `app.vue`.

## Files

| File | Purpose |
|------|---------|
| `stores/ui.ts` | Pinia store — toasts queue, toast location, loading state |
| `composables/useToast.ts` | Convenience wrapper for showing toasts |
| `composables/useLoader.ts` | Convenience wrapper for the loading overlay |
| `composables/useConfirm.ts` | Promise-based confirmation dialog |
| `components/global/UiProvider.vue` | Mounts all global UI: progress bar, overlay, toasts, confirm dialog |

---

## Toast Notifications

Powered by Vuetify's `v-snackbar-queue`. Up to 3 toasts visible at once. Each auto-dismisses with a bottom timer bar.

### Usage

```ts
const toast = useToast()

toast.success('Profile saved!')
toast.error('Failed to delete. Please try again.')
toast.warning('Your session expires in 5 minutes.')
toast.info('New version available.')
```

### Custom toast

```ts
toast.show({
  text: 'Uploading file...',
  color: 'primary',
  prependIcon: 'mdi-upload',
  timeout: -1, // no auto-dismiss
})
```

### Promise-based toast

```ts
toast.show({
  text: 'Saving...',
  promise: saveToApi(),
  success: () => ({ text: 'Saved!', color: 'success', timeout: 2000 }),
  error: (e) => ({ text: `Failed: ${e?.message}`, color: 'error', timeout: 4000 }),
})
```

### Changing position

```ts
toast.setLocation('top end')      // top right
toast.setLocation('bottom center') // bottom center (Material default)
toast.setLocation('top start')    // top left
```

Available positions: `bottom center` | `bottom end` | `bottom start` | `top center` | `top end` | `top start`

---

## Loading Indicators

Two modes run simultaneously:

- **Top progress bar** — automatically shown on every route navigation (no code needed)
- **Full-screen overlay** — manually triggered for async operations

### Usage

```ts
const loader = useLoader()

loader.start()              // overlay with no message
loader.start('Uploading…') // overlay with a message
loader.stop()

// Check state
if (loader.isLoading.value) { ... }
```

### Typical pattern

```ts
loader.start('Saving changes...')
try {
  await saveData()
  toast.success('Saved!')
} finally {
  loader.stop()
}
```

---

## Confirmation Dialog

`useConfirm` returns a promise that resolves `true` (confirmed) or `false` (cancelled). Uses module-level shared state so it works from any component.

### Usage

```ts
const { confirm } = useConfirm()

// Simple string
const ok = await confirm('Are you sure you want to delete this?')
if (ok) { ... }

// With options
const ok = await confirm({
  title: 'Delete account',
  message: 'This action cannot be undone.',
  confirmText: 'Delete',
  cancelText: 'Keep account',
  color: 'error',
})
```

---

## HTTP Error Handling

`useApiFetch` automatically handles these cases without extra code in your pages:

| Status | Behaviour |
|--------|-----------|
| `401` | Logs the user out and redirects to `/auth/login` |
| `5xx` | Shows an error toast: "Something went wrong. Please try again later." |
| Other errors | Thrown as-is for the caller to handle |

For expected errors (e.g. 400 validation), catch and handle them in your component:

```ts
try {
  await useApiFetch('/users', { method: 'POST', body: form })
} catch (e: any) {
  if (e?.response?.status === 422) {
    formError.value = e.data?.message
  }
}
```
