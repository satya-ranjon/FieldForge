import { requireJwtSecret } from '@fieldforge/common';

/**
 * The gateway is the verifying half of the trust boundary and `auth-service`
 * the signing half; both resolve their key through `requireJwtSecret`. The spec
 * lives here because `packages/common` has no Jest harness of its own, and the
 * gateway is the workspace where a regression does the most damage.
 */
describe('requireJwtSecret', () => {
  const VALID = 'K7pQ2xR9mN4vL8wY3tB6zH1jF5sD0aG2cE4nU7iO9kP';

  it('returns the configured secret', () => {
    expect(requireJwtSecret({ JWT_SECRET: VALID })).toBe(VALID);
  });

  it.each([
    ['unset', undefined],
    ['empty', ''],
    ['whitespace only', '   ']
  ])('throws when JWT_SECRET is %s', (_label, value) => {
    // The whole point of the change: no fallback. A service without a key must
    // fail to start rather than quietly adopt one that is public.
    expect(() => requireJwtSecret({ JWT_SECRET: value })).toThrow(/JWT_SECRET is not set/);
  });

  it.each([
    'super_secret_jwt_key_fieldforge_2026',
    'super_secret_jwt_key_fieldforge',
    'replace-at-deploy-time'
  ])('rejects %s, which is published in this repository', (published) => {
    // These were committed, so every clone and fork holds them. Length alone
    // would not catch the first one: it is 36 characters.
    expect(() => requireJwtSecret({ JWT_SECRET: published })).toThrow(
      /published in this repository/
    );
  });

  it('rejects a secret shorter than the 32 bytes HS256 requires', () => {
    expect(() => requireJwtSecret({ JWT_SECRET: 'a'.repeat(31) })).toThrow(
      /at least 32 characters/
    );
  });

  it('accepts a secret of exactly the minimum length', () => {
    const exact = 'b'.repeat(32);
    expect(requireJwtSecret({ JWT_SECRET: exact })).toBe(exact);
  });

  it('trims surrounding whitespace so signer and verifier cannot disagree', () => {
    // A trailing newline from `echo ... >> .env` would otherwise make two
    // services holding "the same" key reject each other's tokens.
    expect(requireJwtSecret({ JWT_SECRET: `  ${VALID}\n` })).toBe(VALID);
  });

  it('never puts the secret value in the error message', () => {
    const short = 'short-secret-value';
    try {
      requireJwtSecret({ JWT_SECRET: short });
      throw new Error('expected requireJwtSecret to throw');
    } catch (err) {
      expect((err as Error).message).not.toContain(short);
    }
  });
});
