import { decryptValue, encryptValue } from '../../src/service/encrypted-store.svc.ts';

describe('encrypted-store.svc', () => {
  const salt = 'test-salt-v1';

  describe('encryptValue / decryptValue', () => {
    it('round-trips a plaintext value', () => {
      const plain = 'my-secret-token';
      const encrypted = encryptValue(plain, salt);
      expect(encrypted).not.toBe(plain);
      expect(decryptValue(encrypted, salt)).toBe(plain);
    });

    it('produces different ciphertext each time due to random IV', () => {
      const plain = 'same-token';
      const a = encryptValue(plain, salt);
      const b = encryptValue(plain, salt);
      expect(a).not.toBe(b);
      expect(decryptValue(a, salt)).toBe(plain);
      expect(decryptValue(b, salt)).toBe(plain);
    });

    it('throws on invalid encrypted format', () => {
      expect(() => decryptValue('not-valid-base64!!!', salt)).toThrow(/Invalid encrypted token format/);
    });

    it('cannot decrypt with a different salt', () => {
      const encrypted = encryptValue('secret', 'salt-a');
      expect(() => decryptValue(encrypted, 'salt-b')).toThrow();
    });
  });
});
