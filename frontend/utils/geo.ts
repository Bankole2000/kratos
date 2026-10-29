export interface LatLng {
  lat: number
  lng: number
}

const R = 6371000 // Earth radius in metres

const toRad = (deg: number) => (deg * Math.PI) / 180
const toDeg = (rad: number) => (rad * 180) / Math.PI

/** Haversine distance between two points in metres */
export const haversineDistance = (a: LatLng, b: LatLng): number => {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Initial compass bearing from a → b in degrees (0–360) */
export const bearing = (a: LatLng, b: LatLng): number => {
  const dLng = toRad(b.lng - a.lng)
  const y = Math.sin(dLng) * Math.cos(toRad(b.lat))
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLng)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

/** Cardinal direction label for a bearing */
export const cardinalDirection = (deg: number): string => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const
  return dirs[Math.round(deg / 45) % 8]!
}

/** Format metres as a human-readable string */
export const formatDistance = (metres: number): string => {
  if (metres < 1000) return `${Math.round(metres)} m`
  return `${(metres / 1000).toFixed(2)} km`
}

/** True if lat/lng values are within valid ranges */
export const isValidCoord = (point: LatLng): boolean =>
  point.lat >= -90 && point.lat <= 90 && point.lng >= -180 && point.lng <= 180

/**
 * Nearest-neighbour TSP heuristic.
 * Returns a reordered copy of `waypoints` starting from index 0,
 * plus the total estimated route distance in metres.
 */
export const optimizeRoute = (
  waypoints: LatLng[],
): { ordered: LatLng[]; totalDistance: number } => {
  if (waypoints.length <= 2) {
    const totalDistance =
      waypoints.length === 2
        ? haversineDistance(waypoints[0]!, waypoints[1]!)
        : 0
    return { ordered: [...waypoints], totalDistance }
  }

  const unvisited = waypoints.slice(1)
  const ordered: LatLng[] = [waypoints[0]!]
  let totalDistance = 0

  while (unvisited.length > 0) {
    const current = ordered[ordered.length - 1]!
    let nearestIdx = 0
    let nearestDist = haversineDistance(current, unvisited[0]!)

    for (let i = 1; i < unvisited.length; i++) {
      const d = haversineDistance(current, unvisited[i]!)
      if (d < nearestDist) {
        nearestDist = d
        nearestIdx = i
      }
    }

    totalDistance += nearestDist
    ordered.push(unvisited[nearestIdx]!)
    unvisited.splice(nearestIdx, 1)
  }

  return { ordered, totalDistance }
}
