import { describe, it } from 'node:test';
import { createSbom, validateIsCycloneDxSbom } from '../../src/service/eol/eol.svc.ts';
import assert from 'node:assert';

describe('eol.svc', () => {
  describe('validateIsCycloneDxSbom', () => {
    it('should throw an error if the SBOM is not an object', () => {
      assert.throws(() => validateIsCycloneDxSbom('hello'));
    });

    it('should throw an error if the SBOM is not in CycloneDX format', () => {
      assert.throws(() =>
        validateIsCycloneDxSbom({
          bomFormat: 'SPDX',
        }),
      );
    });

    it('should throw an error if the SBOM is missing a specVersion', () => {
      assert.throws(() =>
        validateIsCycloneDxSbom({
          bomFormat: 'CycloneDX',
        }),
      );
    });

    it('should throw an error if the SBOM has no component array', () => {
      assert.throws(() =>
        validateIsCycloneDxSbom({
          bomFormat: 'CycloneDX',
          specVersion: 1,
        }),
      );
    });

    it('should not throw an error if all criteria pass', () => {
      assert.throws(() =>
        validateIsCycloneDxSbom({
          bomFormat: 'CycloneDX',
          components: [],
          specVersion: 1,
        }),
      );
    });
  });
});
