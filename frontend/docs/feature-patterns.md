# Feature Patterns

## File Upload

### Components
| File | Purpose |
|------|---------|
| `components/common/FileUpload.vue` | Drop zone with progress, validation, per-file status |
| `components/common/ImagePreview.vue` | Canvas-based image preview with rotate and crop — no extra packages |

### FileUpload props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `accept` | `string` | `'*/*'` | MIME types or extensions: `'image/*'`, `'.pdf,.docx'` |
| `multiple` | `boolean` | `true` | Allow multiple files |
| `maxSizeMb` | `number` | `10` | Per-file size limit in MB |
| `maxFiles` | `number` | `10` | Maximum total files at once |

### Events

| Event | Payload | When |
|-------|---------|------|
| `upload` | `UploadFile[]` | After all pending files finish uploading |
| `preview` | `UploadFile` | When user clicks an image thumbnail |

### Usage

```vue
<CommonFileUpload
  accept="image/*"
  multiple
  :max-size-mb="5"
  @upload="onUpload"
  @preview="onPreview"
/>

<CommonImagePreview
  v-model="previewOpen"
  :file="previewFile"
  @confirm="onConfirm"
/>
```

The `@confirm` handler receives `(dataUrl: string, file: UploadFile)` — the processed canvas output as a base64 JPEG and the original file entry.

### Replacing the simulated upload

The `simulateUpload` method in `FileUpload.vue` fakes progress with `setTimeout`. Replace it with your real API call:

```ts
const simulateUpload = async (entry: UploadFile) => {
  entry.status = 'uploading'
  const form = new FormData()
  form.append('file', entry.file)
  // Report progress via XHR or fetch streaming if needed
  await useApiFetch('/upload', { method: 'POST', body: form })
  entry.status = 'done'
  entry.progress = 100
}
```

---

## Pagination & Infinite Scroll

### `usePagination`

Page-based fetching. Fetches automatically on mount and on any page/pageSize change.

```ts
const { items, page, totalPages, total, loading, hasNext, hasPrev,
        goToPage, nextPage, prevPage, setPageSize, refresh } =
  usePagination(
    async (page, pageSize) => {
      const data = await useApiFetch<{ items: Post[]; total: number }>(
        `/posts?page=${page}&limit=${pageSize}`
      )
      return data
    },
    { initialPage: 1, initialPageSize: 10 },
  )
```

### `useInfiniteScroll`

Appends items as the user scrolls. Attach `ref="sentinel"` to an element at the bottom of your list — an `IntersectionObserver` fires the next page load automatically.

```ts
const { items, total, loading, hasMore, sentinel, reset } =
  useInfiniteScroll(
    async (page, pageSize) => useApiFetch(`/posts?page=${page}&limit=${pageSize}`),
    { pageSize: 15 },
  )
```

```html
<div v-for="item in items" :key="item.id">...</div>
<div ref="sentinel">
  <v-progress-circular v-if="loading" indeterminate />
  <span v-else-if="!hasMore">All loaded</span>
</div>
```

Both composables expect the fetcher to return `{ items: T[], total: number }`.

---

## WebSocket

### Setup

Set your WebSocket server URL in `.env`:

```env
NUXT_PUBLIC_WS_URL=http://localhost:3001
```

The socket is created in `plugins/socket.ts` with `autoConnect: false` — it won't connect until you call `connect()`. This prevents unnecessary connections on pages that don't need it.

### `useSocket()`

```ts
const { status, on, emit, connect, disconnect } = useSocket()
```

| Return | Type | Description |
|--------|------|-------------|
| `status` | `Ref<'connected' \| 'connecting' \| 'disconnected' \| 'error'>` | Reactive connection state |
| `on(event, handler)` | `void` | Subscribe to a server event. Auto-unsubscribes on component unmount. |
| `emit(event, data)` | `void` | Send an event to the server |
| `connect()` | `void` | Open the connection |
| `disconnect()` | `void` | Close the connection |

### Typed events

```ts
interface ServerToClientEvents {
  notification: (n: { title: string; body: string; type: 'success' | 'error' }) => void
  'chat:message': (msg: { user: string; text: string; ts: number }) => void
}

const { on, emit } = useSocket()

on<ServerToClientEvents['notification']>('notification', (n) => {
  toast[n.type](`${n.title}: ${n.body}`)
})

on<ServerToClientEvents['chat:message']>('chat:message', (msg) => {
  messages.value.push(msg)
})
```

### Reconnection

Socket.IO handles reconnection automatically. The `useSocket` composable tracks reconnect attempts and surfaces them via `status`:

- `'connecting'` — during a reconnect attempt
- `'connected'` — once reconnected
- `'error'` — if all reconnect attempts are exhausted

Configure attempts and delay in `plugins/socket.ts`:

```ts
const socket = io(wsUrl, {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
})
```
