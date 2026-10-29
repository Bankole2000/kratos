export interface TimetableTask {
  id: string
  title: string
  color: string
  day: number       // 0 = Mon … 6 = Sun
  startSlot: number // slot index relative to viewStart (derived, kept in sync)
  span: number      // duration in slots (derived, kept in sync)
  startMin: number  // absolute minutes from midnight (source of truth)
  spanMin: number   // duration in minutes (source of truth)
}

export type TimetableGran = 60 | 30 | 15 | 10
