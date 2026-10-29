# Geolocation

All geolocation features work without an API key. The map uses OpenStreetMap tiles via Leaflet, routing uses the public OSRM server, and reverse geocoding uses Nominatim.

For production use, host your own OSRM and Nominatim instances or switch to a commercial provider — the public endpoints have rate limits.

---

## Package

```
leaflet + @types/leaflet
```

Leaflet is imported dynamically inside `MapView.vue` to keep it client-side only. No SSR issues.

---

## `useGeolocation`

Wraps `navigator.geolocation` with reactive state.

```ts
const { coords, error, loading, isWatching, locate, startWatch, stopWatch } = useGeolocation()
```

| Return | Type | Description |
|--------|------|-------------|
| `coords` | `Ref<GeoCoords \| null>` | Latest position |
| `error` | `Ref<string \| null>` | Permission denied / unavailable / timeout |
| `loading` | `Ref<boolean>` | True during a one-shot `locate()` call |
| `isWatching` | `Ref<boolean>` | True while `watchPosition` is active |
| `locate()` | `Promise<GeoCoords>` | One-shot position fetch |
| `startWatch()` | `void` | Start continuous updates |
| `stopWatch()` | `void` | Clear the watch (called automatically on unmount) |

`GeoCoords` includes `lat`, `lng`, `accuracy`, `altitude`, `heading`, `speed`, and `timestamp`.

---

## `useReverseGeocode`

Converts a lat/lng pair to a human-readable address using the Nominatim API (no key required).

```ts
const { address, loading, error, lookup } = useReverseGeocode()
await lookup(lat, lng)
```

`address` is a `Ref<GeoAddress | null>` with fields: `display`, `road`, `suburb`, `city`, `state`, `country`, `postcode`.

---

## `useRouting`

Fetches a driving route between ordered waypoints via the public OSRM API. Optionally runs the nearest-neighbour TSP heuristic first to reorder stops.

```ts
const { route, loading, error, fetchRoute, clearRoute } = useRouting()

// Simple ordered route
await fetchRoute([
  { lat: 51.5074, lng: -0.1278 },
  { lat: 48.8566, lng: 2.3522 },
])

// With TSP optimization (reorders waypoints[1..n], keeps [0] as start)
await fetchRoute(waypoints, true)
```

`route` is a `Ref<RouteResult | null>`:

| Field | Type | Description |
|-------|------|-------------|
| `waypoints` | `LatLng[]` | Ordered waypoints (post-TSP if enabled) |
| `geometry` | `LatLng[]` | Full polyline for drawing on the map |
| `steps` | `RouteStep[]` | Turn-by-turn instructions |
| `totalDistance` | `number` | Metres |
| `totalDuration` | `number` | Seconds |
| `totalDistanceText` | `string` | e.g. `"342.15 km"` |
| `totalDurationText` | `string` | e.g. `"3h 12m"` |

---

## `MapView` component

Client-side only — always wrap in `<ClientOnly>`.

```vue
<ClientOnly>
  <MapMapView
    :markers="markers"
    :route-geometry="routeGeometry"
    :center="{ lat: 51.5, lng: -0.1 }"
    :zoom="13"
    height="400px"
    @map-click="onMapClick"
  />
</ClientOnly>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `markers` | `MapMarker[]` | `[]` | Pins to render |
| `routeGeometry` | `LatLng[]` | `[]` | Polyline points from `route.geometry` |
| `center` | `LatLng` | first marker | Map center |
| `zoom` | `number` | `13` | Initial zoom level |
| `height` | `string` | `'400px'` | CSS height of the map container |

`@map-click` emits `LatLng` whenever the user clicks the map.

`MapMarker` interface:
```ts
interface MapMarker {
  id: string | number
  lat: number
  lng: number
  label?: string      // tooltip text
  isUser?: boolean    // renders as a blue circle instead of a pin
}
```

Expose: `mapRef.fitToMarkers()` — pans and zooms to fit all current markers.

---

## `utils/geo.ts`

Pure TypeScript, no dependencies.

| Export | Signature | Description |
|--------|-----------|-------------|
| `haversineDistance` | `(a, b: LatLng) => number` | Distance in metres |
| `bearing` | `(a, b: LatLng) => number` | Initial bearing in degrees (0–360) |
| `cardinalDirection` | `(deg: number) => string` | `'N'`, `'NE'`, `'E'` … |
| `formatDistance` | `(metres: number) => string` | `'342 m'` or `'1.23 km'` |
| `isValidCoord` | `(point: LatLng) => boolean` | Validates lat/lng ranges |
| `optimizeRoute` | `(waypoints: LatLng[]) => { ordered, totalDistance }` | Nearest-neighbour TSP |

### TSP notes

`optimizeRoute` fixes the first waypoint as the start and greedily picks the nearest unvisited stop at each step. Time complexity is O(n²) — fine for up to ~100 stops in the browser. For larger inputs or optimal solutions, integrate [Google OR-Tools](https://developers.google.com/optimization) or a VRP solver.
