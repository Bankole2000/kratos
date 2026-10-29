import { serializeCountry } from '../countries/countries.service';

// Registry of SYNC-classified resource types exposed via the sync API. Each
// entry names the Prisma delegate holding that type's rows (all of which
// carry `id` and `version` columns, per the shared sync-row shape) and an
// optional serializer for fields that shouldn't go over the wire as-is
// (e.g. Country.flagSvg, a byte blob).
type SyncDelegateName = 'country' | 'currency' | 'timezone' | 'language' | 'vendor' | 'category';

export interface SyncResourceConfig {
  delegate: SyncDelegateName;
  serialize?: (row: unknown) => unknown;
}

export const SYNC_RESOURCE_REGISTRY: Record<string, SyncResourceConfig> = {
  country: { delegate: 'country', serialize: (row) => serializeCountry(row as Parameters<typeof serializeCountry>[0]) },
  currency: { delegate: 'currency' },
  timezone: { delegate: 'timezone' },
  language: { delegate: 'language' },
  vendor: { delegate: 'vendor' },
  category: { delegate: 'category' },
};
