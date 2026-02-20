import { describe, expect, it } from 'vitest';
import { decodeJwtPayload } from '../../src/service/jwt.svc.ts';

function createJwtToken(payload: unknown): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${encodedPayload}.signature`;
}

describe('jwt.svc', () => {
  describe('decodeJwtPayload', () => {
    it('returns decoded payload for a valid JWT', () => {
      const token = createJwtToken({
        sub: 'user-1',
        email: 'dev@herodevs.com',
      });

      expect(decodeJwtPayload(token)).toEqual({
        sub: 'user-1',
        email: 'dev@herodevs.com',
      });
    });

    it('returns undefined when token is missing', () => {
      expect(decodeJwtPayload(undefined)).toBeUndefined();
    });

    it('returns undefined when token format is invalid', () => {
      expect(decodeJwtPayload('not-a-jwt')).toBeUndefined();
      expect(decodeJwtPayload('header..signature')).toBeUndefined();
    });

    it('returns undefined when payload is not valid JSON', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const invalidJsonPayload = Buffer.from('not-json').toString('base64url');

      expect(decodeJwtPayload(`${header}.${invalidJsonPayload}.signature`)).toBeUndefined();
    });

    it('returns undefined when payload is not an object', () => {
      expect(decodeJwtPayload(createJwtToken('string-payload'))).toBeUndefined();
      expect(decodeJwtPayload(createJwtToken(['array-payload']))).toBeUndefined();
      expect(decodeJwtPayload(createJwtToken(123))).toBeUndefined();
      expect(decodeJwtPayload(createJwtToken(null))).toBeUndefined();
    });
  });
});
