import { randomBytes, createHash } from 'crypto';

const KEY_PREFIX_LENGTH = 12;

export interface GeneratedApiKey {
  raw: string;
  hashedKey: string;
  keyPrefix: string;
}

// Plaintext is shown to the caller exactly once (at creation time) and never
// stored — only its SHA-256 hash persists, matched against on every request.
// SHA-256 (not bcrypt) is intentional: the key itself is already
// high-entropy random data, so there's nothing for a slow hash to protect
// against that fast hashing doesn't already — unlike a user password.
export function generateApiKey(): GeneratedApiKey {
  const raw = `crs_${randomBytes(32).toString('base64url')}`;
  const hashedKey = createHash('sha256').update(raw).digest('hex');
  const keyPrefix = raw.slice(0, KEY_PREFIX_LENGTH);
  return { raw, hashedKey, keyPrefix };
}

export function hashApiKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
