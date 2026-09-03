/**
 * Resolution of the shared HS256 signing key.
 *
 * Both the token issuer (`auth-service`) and the token verifier (`api-gateway`)
 * read the key through this one function. That is deliberate: a signer and a
 * verifier that disagree about the key produce "invalid signature" on every
 * request, and a signer and verifier that silently *agree* on a hardcoded
 * default produce something far worse — a trust boundary anyone holding a copy
 * of this repository can forge their way through.
 *
 * There is no fallback value. A missing key stops the process at startup rather
 * than downgrading it to a public one.
 */

/**
 * RFC 7518 section 3.2 requires an HMAC-SHA256 key of at least the size of the
 * hash output — 256 bits, i.e. 32 bytes. Shorter keys narrow the brute-force
 * space against a captured token.
 */
const MIN_SECRET_LENGTH = 32;

/**
 * Keys that have been published in this repository or its git history and can
 * therefore never be used again, at any length.
 *
 * The length check alone does not cover these: the 2026 default below is 36
 * characters and would otherwise pass. History rewriting does not help either —
 * every clone and fork already has these values, so the only real remedy is to
 * refuse them.
 */
const PUBLISHED_SECRETS: readonly string[] = [
  'super_secret_jwt_key_fieldforge_2026',
  'super_secret_jwt_key_fieldforge',
  'replace-at-deploy-time'
];

const GENERATE_HINT =
  "Generate one with: node -e \"console.log(require('node:crypto').randomBytes(48).toString('base64url'))\"";

/**
 * Returns the configured JWT signing key, or throws if it is absent, too short,
 * or known to be public.
 *
 * Call this from a module factory (`JwtModule.registerAsync`) rather than at
 * import time, so that the failure surfaces inside `bootstrap()` and is reported
 * through the service's fatal logger instead of as a bare module-load stack
 * trace.
 *
 * Surrounding whitespace is stripped before use. A trailing newline picked up
 * from a shell redirect into `.env` would otherwise make an issuer and a
 * verifier that hold "the same" key reject each other's tokens. Because both
 * sides normalise here, they cannot disagree.
 *
 * @param env Environment to read from. Injected for testing; defaults to the
 *   real process environment.
 * @throws Error if the key is unusable. The message never includes the value.
 */
import { loadEnv } from './env';

export function requireJwtSecret(env: NodeJS.ProcessEnv = process.env): string {
  if (env === process.env && (!env.JWT_SECRET || env.JWT_SECRET.trim() === '')) {
    loadEnv(env);
  }

  const raw = env.JWT_SECRET;

  if (raw === undefined || raw.trim() === '') {
    throw new Error(
      `JWT_SECRET is not set. The service refuses to start without a signing key rather than fall back to a shared default. ${GENERATE_HINT}`
    );
  }

  const secret = raw.trim();

  if (PUBLISHED_SECRETS.includes(secret)) {
    throw new Error(
      `JWT_SECRET is set to a value published in this repository's source or git history, so it is public and forgeable. Replace it everywhere it is configured. ${GENERATE_HINT}`
    );
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters for HS256 (RFC 7518 section 3.2); got ${secret.length}. ${GENERATE_HINT}`
    );
  }

  return secret;
}
