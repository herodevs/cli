import { describe, expect, it } from 'vitest';
import { parseCiCredential } from '../../src/utils/ci-credential.ts';

describe('parseCiCredential', () => {
  it('returns undefined when credential is undefined', () => {
    expect(parseCiCredential(undefined)).toEqual({
      ciTokenFromEnv: undefined,
      orgIdFromEnv: undefined,
    });
  });

  it('returns undefined when credential is empty string', () => {
    expect(parseCiCredential('')).toEqual({
      ciTokenFromEnv: undefined,
      orgIdFromEnv: undefined,
    });
  });

  it('returns undefined when credential is whitespace only', () => {
    expect(parseCiCredential('   ')).toEqual({
      ciTokenFromEnv: undefined,
      orgIdFromEnv: undefined,
    });
  });

  it('returns undefined when missing colon', () => {
    expect(parseCiCredential('123')).toEqual({
      ciTokenFromEnv: undefined,
      orgIdFromEnv: undefined,
    });
  });

  it('returns undefined when orgId is empty', () => {
    expect(parseCiCredential(':token')).toEqual({
      ciTokenFromEnv: undefined,
      orgIdFromEnv: undefined,
    });
  });

  it('returns undefined when token is empty', () => {
    expect(parseCiCredential('123:')).toEqual({
      ciTokenFromEnv: undefined,
      orgIdFromEnv: undefined,
    });
  });

  it('returns undefined when orgId is not a positive integer', () => {
    expect(parseCiCredential('0:token')).toEqual({
      ciTokenFromEnv: undefined,
      orgIdFromEnv: undefined,
    });
    expect(parseCiCredential('-1:token')).toEqual({
      ciTokenFromEnv: undefined,
      orgIdFromEnv: undefined,
    });
    expect(parseCiCredential('abc:token')).toEqual({
      ciTokenFromEnv: undefined,
      orgIdFromEnv: undefined,
    });
  });

  it('parses valid orgId:token format', () => {
    expect(parseCiCredential('123:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')).toEqual({
      ciTokenFromEnv: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      orgIdFromEnv: 123,
    });
  });

  it('handles token with colons (splits on first colon only)', () => {
    expect(parseCiCredential('42:token:with:colons')).toEqual({
      ciTokenFromEnv: 'token:with:colons',
      orgIdFromEnv: 42,
    });
  });

  it('trims whitespace around credential', () => {
    expect(parseCiCredential('  99:secret  ')).toEqual({
      ciTokenFromEnv: 'secret',
      orgIdFromEnv: 99,
    });
  });
});
