# Auth Flow

JWT-based authentication using Pinia for in-memory state. Tokens are lost on page refresh by design — the store is structured so persistence can be added later with minimal changes.

## Files

| File | Purpose |
|------|---------|
| `stores/auth.ts` | Pinia store — holds `user`, `accessToken`, `refreshToken`, `isRefreshing` |
| `composables/useAuth.ts` | Actions: `login`, `register`, `logout`, `forgotPassword`, `resetPassword` |
| `composables/useApiFetch.ts` | `$fetch` wrapper that auto-attaches `Authorization: Bearer` header |
| `plugins/api.ts` | `$fetch` instance with auth headers, 401 refresh logic, and 5xx toast |
| `middleware/auth.ts` | Route guard — redirects unauthenticated users to `/auth/login?redirect=<path>` |
| `layouts/blank.vue` | Centered card layout used by all auth pages |
| `pages/auth/login.vue` | Email + password login form |
| `pages/auth/register.vue` | Name, email, password, confirm password |
| `pages/auth/forgot-password.vue` | Email input → success state |
| `pages/auth/reset-password.vue` | New password form, reads `?token=` from query string |

## Environment

Copy `.env.example` to `.env` and set your API base URL:

```env
NUXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

## API Endpoints Expected

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/auth/login` | `{ email, password }` | `{ accessToken, refreshToken, user }` |
| `POST` | `/auth/register` | `{ name, email, password }` | `{ accessToken, refreshToken, user }` |
| `POST` | `/auth/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| `POST` | `/auth/forgot-password` | `{ email }` | any |
| `POST` | `/auth/reset-password` | `{ token, password }` | any |

`user` shape: `{ id: string, name: string, email: string }`

## Token Refresh

When any API request returns a `401`, `plugins/api.ts` automatically:

1. Calls `POST /auth/refresh` with the stored refresh token
2. Updates the store with new tokens
3. Retries the original failed request transparently
4. If the refresh itself fails → logs the user out and redirects to `/auth/login`

**Concurrent 401 handling:** If multiple requests 401 simultaneously, only one refresh call is fired. The others are queued and replayed once the new token is available — no duplicate refresh calls.

The refresh logic explicitly skips `/auth/refresh` and `/auth/login` URLs to prevent infinite retry loops.

## Redirect After Login

When an unauthenticated user tries to access a protected route, the middleware redirects them to:

```
/auth/login?redirect=/original/path
```

After a successful login or register, `useAuth` reads the `?redirect` query param and sends the user back to their intended destination. The redirect is validated to only accept paths starting with `/` to prevent open redirect attacks.

## Protecting Routes

```vue
<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
</script>
```

## Making Authenticated API Calls

```ts
const data = await useApiFetch<MyType>('/some/protected/endpoint')

const result = await useApiFetch<MyType>('/items', {
  method: 'POST',
  body: { name: 'new item' },
})
```

## Accessing Auth State

```ts
const { user, isAuthenticated, logout } = useAuth()
```

Both `user` and `isAuthenticated` are reactive computed refs.

## Adding Token Persistence

The store is in-memory by default. To persist across page refreshes, replace the `state` fields in `stores/auth.ts` with VueUse's `useLocalStorage`:

```ts
import { useLocalStorage } from '@vueuse/core'

state: () => ({
  user: useLocalStorage<User | null>('auth:user', null),
  accessToken: useLocalStorage<string | null>('auth:access-token', null),
  refreshToken: useLocalStorage<string | null>('auth:refresh-token', null),
  isRefreshing: false,
}),
```
