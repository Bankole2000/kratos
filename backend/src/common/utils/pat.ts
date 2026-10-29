import { randomBytes, createHash } from 'crypto';

const TOKEN_PREFIX_LENGTH = 12;

export interface GeneratedPat {
  raw: string;
  hashedToken: string;
  tokenPrefix: string;
}

// Same hashing rationale as generateApiKey() in api-key.ts: the token is
// already high-entropy random data, so SHA-256 is sufficient — no need for
// a slow password-hashing algorithm here, unlike User.password.
export function generatePat(): GeneratedPat {
  const raw = `pat_${randomBytes(32).toString('base64url')}`;
  const hashedToken = createHash('sha256').update(raw).digest('hex');
  const tokenPrefix = raw.slice(0, TOKEN_PREFIX_LENGTH);
  return { raw, hashedToken, tokenPrefix };
}

export function hashPat(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
