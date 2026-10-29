export interface PaginatedResult<T> {
  items: T[]
  limit: number
  offset: number
  total: number
}

export interface Country {
  id: string
  name: string
  alpha2: string
  alpha3: string
  callingCode: string
  region: string
  flagEmoji: string
  flagSvgBase64: string | null
  metadata: Record<string, unknown> | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface Province {
  id: string
  countryId: string
  name: string
  code: string | null
  divisionType: string
  metadata: Record<string, unknown> | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface City {
  id: string
  countryId: string
  provinceId: string | null
  name: string
  metadata: Record<string, unknown> | null
  version: number
  createdAt: string
  updatedAt: string
}

export type CurrencyKind = 'FIAT' | 'CRYPTO' | 'IN_GAME'

export interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  decimalDigits: number
  kind: CurrencyKind
  metadata: Record<string, unknown> | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface ExchangeRate {
  id: string
  baseCurrencyId: string
  quoteCurrencyId: string
  rate: number
  source: string
  fetchedAt: string
  metadata: Record<string, unknown> | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface ExchangeRateRefreshResult {
  updated: number
  skipped: number
  fetchedAt: string
  source: string
}

export interface Unit {
  id: string
  name: string
  symbol: string
  unitCategory: string
  isBaseUnit: boolean
  conversionFactor: number
  metadata: Record<string, unknown> | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface Timezone {
  id: string
  identifier: string
  utcOffset: string
  displayName: string
  metadata: Record<string, unknown> | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface Language {
  id: string
  code: string
  name: string
  nativeName: string
  metadata: Record<string, unknown> | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface Company {
  id: string
  name: string
  metadata: Record<string, unknown> | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface Bank {
  id: string
  name: string
  companyId: string | null
  swiftBic: string | null
  website: string | null
  metadata: Record<string, unknown> | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface Vendor {
  id: string
  name: string
  companyId: string | null
  categoryId: string | null
  industryId: string | null
  metadata: Record<string, unknown> | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface CategoryGroup {
  id: string
  name: string
  metadata: Record<string, unknown> | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  groupId: string | null
  metadata: Record<string, unknown> | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface Industry {
  id: string
  name: string
  metadata: Record<string, unknown> | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface Location {
  id: string
  companyId: string | null
  vendorId: string | null
  bankId: string | null
  isHeadquarters: boolean
  addressLine1: string
  addressLine2: string | null
  city: string
  provinceId: string | null
  cityId: string | null
  postalCode: string | null
  countryId: string | null
  latitude: number | null
  longitude: number | null
  metadata: Record<string, unknown> | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  name: string
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP'

export interface NotificationTemplate {
  id: string
  projectId: string | null
  key: string
  channel: NotificationChannel
  content: Record<string, string>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ApiKey {
  id: string
  projectId: string
  keyPrefix: string
  rateLimitPerMin: number
  revokedAt: string | null
  lastUsedAt: string | null
  createdAt: string
}

export interface ApiKeyCreated extends ApiKey {
  key: string
}
