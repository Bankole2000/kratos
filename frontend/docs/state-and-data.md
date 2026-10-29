# State & Data

## Architecture

```
plugins/api.ts          ← $fetch instance with auth headers + error interceptors
  ↓
composables/useApiFetch.ts   ← thin wrapper for one-off calls in components
composables/useApi.ts        ← per-request loading/error state wrapper
stores/*.ts                  ← Pinia stores that call $api directly for CRUD
```

All HTTP goes through `plugins/api.ts`. It is provided as `$api` via `useNuxtApp()` and is available in both components and Pinia store actions.

---

## The `$api` Plugin (`plugins/api.ts`)

A `$fetch` instance configured with:
- `baseURL` from `NUXT_PUBLIC_API_BASE_URL`
- Automatic `Authorization: Bearer <token>` header injection
- 401 → logout + redirect to `/auth/login`
- 5xx → global error toast

You rarely call `$api` directly — use the composables or stores below.

---

## `useApiFetch` — one-off requests in components

For simple calls where you don't need reactive loading state:

```ts
const data = await useApiFetch<User>('/users/me')

const result = await useApiFetch<Post>('/posts', {
  method: 'POST',
  body: { title: 'Hello', body: 'World' },
})
```

---

## `useApi` — reactive loading + error state

Wraps any async function with `data`, `loading`, and `error` refs. Best for page-level data fetching.

```ts
const { data, loading, error, execute } = useApi(
  () => useApiFetch<Post[]>('/posts')
)

// Fetch immediately on mount
const { data: posts } = useApi(
  () => useApiFetch<Post[]>('/posts'),
  { immediate: true }
)

// Fetch on demand
await execute()

// With arguments
const { data: post, execute: fetchPost } = useApi(
  (id: string) => useApiFetch<Post>(`/posts/${id}`)
)
await fetchPost('abc123')
```

The `error` ref captures `response.data.message` if present, falls back to `error.message`. 401 and 5xx errors are handled globally by the plugin before the error reaches `useApi`.

---

## Pinia Stores — CRUD pattern

`stores/posts.ts` is the reference implementation. Copy it and replace `Post` with your resource type.

### Structure

```ts
interface Post { id: string; title: string; body: string; createdAt: string }

// State
{ items: Post[], current: Post | null, loading: boolean, error: string | null }

// Getters
store.count          // number of items
store.findById(id)   // find a single item without a network call
```

### Usage in a component

```ts
const posts = usePostsStore()

// Fetch list
await posts.fetchAll()

// Fetch single
await posts.fetchOne('abc123')

// Create
const newPost = await posts.create({ title: 'Hello', body: 'World' })

// Update
await posts.update('abc123', { title: 'Updated' })

// Delete
await posts.remove('abc123')

// Reactive state
posts.items     // Post[]
posts.current   // Post | null
posts.loading   // boolean
posts.error     // string | null
```

### Creating a new store

1. Copy `stores/posts.ts`
2. Replace `Post` with your type and `/posts` with your endpoint
3. Add/remove actions as needed — the `_begin`, `_end`, `_fail` helpers stay the same

---

## Error Handling Summary

| Layer | What it handles |
|-------|----------------|
| `plugins/api.ts` | 401 (logout + redirect), 5xx (global toast) |
| `stores/*.ts` | Sets `store.error` for display in the UI |
| `useApi` | Sets `error` ref for inline display |
| Components | Catch and handle expected errors (400, 422, etc.) |
