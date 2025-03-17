import assert from 'node:assert';
import { afterEach, describe, it } from 'node:test';
import { prepareRows } from '../../src/service/eol/eol.svc.ts';
import { createMockComponent, createMockModel, createMockScan } from '../utils/mocks/scan-result-component.mock.ts';

describe('eol.svc', () => {
  describe('prepareRows', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    describe('SHOW_OK is true', () => {
      it('should include lines when a purl from the sbom model is present in a scan components Map', async () => {
        // Arrange
        const purl = 'pkg:npm/test@1.0.0';
        const model = createMockModel([purl]);
        const scan = createMockScan([createMockComponent(purl, 'EOL')]);

        // Act
        process.env.SHOW_OK = 'true';
        const rows = await prepareRows(model, scan);

        // Assert
        assert.equal(rows.length, 1);
        assert.equal(rows[0].purl, purl);
      });

      it('should include lines when the line has a status of EOL', async () => {
        // Arrange
        const purl = 'pkg:npm/test@1.0.0';
        const model = createMockModel([purl]);
        const scan = createMockScan([createMockComponent(purl, 'EOL', new Date())]);

        // Act
        process.env.SHOW_OK = 'true';
        const rows = await prepareRows(model, scan);

        // Assert
        assert.equal(rows.length, 1);
        assert.equal(rows[0].status, 'EOL');
      });

      it('should include lines when the line has a status of OK', async () => {
        // Arrange
        const purl = 'pkg:npm/test@1.0.0';
        const model = createMockModel([purl]);
        const component = createMockComponent(purl, 'OK');
        const scan = createMockScan([component]);

        // Act
        process.env.SHOW_OK = 'true';
        const rows = await prepareRows(model, scan);

        // Assert
        assert.equal(rows.length, 1);
        assert.equal(rows[0].status, 'OK');
      });

      it('should properly deserialize dates from string format', async () => {
        // Arrange
        const purl = 'pkg:npm/test@1.0.0';
        const eolDate = new Date('2024-01-01');
        const model = createMockModel([purl]);
        const component = createMockComponent(purl, 'EOL', eolDate);
        const scan = createMockScan([component]);

        // Act
        process.env.SHOW_OK = 'true';
        const rows = await prepareRows(model, scan);

        // Assert
        assert.equal(rows.length, 1);
        assert(rows[0].info.eolAt instanceof Date);
        assert.equal(rows[0].info.eolAt?.toISOString(), eolDate.toISOString());
      });

      it('should include occurrences when SHOW_OCCURRENCES is true', async () => {
        // Arrange
        const purl = 'pkg:npm/test@1.0.0';
        const model = createMockModel([purl]);
        model.components[purl].evidence = {
          occurrences: [{ location: 'test/location' }],
        };
        const scan = createMockScan([createMockComponent(purl, 'EOL', new Date())]);

        // Act
        process.env.SHOW_OK = 'true';
        process.env.SHOW_OCCURRENCES = 'true';
        const rows = await prepareRows(model, scan);

        // Assert
        assert.equal(rows.length, 1);
        assert(rows[0].evidence.includes('test/location'));
      });

      it('should exclude occurrences when SHOW_OCCURRENCES is false', async () => {
        // Arrange
        const purl = 'pkg:npm/test@1.0.0';
        const model = createMockModel([purl]);
        model.components[purl].evidence = {
          occurrences: [{ location: 'test/location' }],
        };
        const scan = createMockScan([createMockComponent(purl, 'EOL', new Date())]);

        // Act
        process.env.SHOW_OK = 'true';
        process.env.SHOW_OCCURRENCES = 'false';
        const rows = await prepareRows(model, scan);

        // Assert
        assert.equal(rows.length, 1);
        assert.equal(rows[0].evidence, '');
      });

      it('should calculate daysEol correctly', async () => {
        // Arrange
        const purl = 'pkg:npm/test@1.0.0';
        const eolDate = new Date();
        eolDate.setDate(eolDate.getDate() - 30); // 30 days ago
        const model = createMockModel([purl]);
        const scan = createMockScan([createMockComponent(purl, 'EOL', eolDate)]);

        // Act
        process.env.SHOW_OK = 'true';
        const rows = await prepareRows(model, scan);

        // Assert
        assert.equal(rows.length, 1);
        assert.equal(rows[0].daysEol, 30);
      });
    });

    describe.skip('SHOW_OK is false', () => {
      it('should exclude lines even when a purl from the sbom model is present in a scan components Map', async () => {
        // Arrange
        const purl = 'pkg:npm/test@1.0.0';
        const model = createMockModel([purl]);
        const scan = createMockScan([createMockComponent(purl)]);

        // Act
        process.env.SHOW_OK = 'false';
        const rows = await prepareRows(model, scan);

        // Assert
        assert.equal(rows.length, 0);
      });

      it('should exclude lines when the line has a status of OK', async () => {
        // Arrange
        const purl = 'pkg:npm/test@1.0.0';
        const model = createMockModel([purl]);
        const scan = createMockScan([createMockComponent(purl, 'OK')]);

        // Act
        process.env.SHOW_OK = 'false';
        const rows = await prepareRows(model, scan);

        // Assert
        assert.equal(rows.length, 0);
      });

      it('should include lines when the line has a status of EOL', async () => {
        // Arrange
        const purl = 'pkg:npm/test@1.0.0';
        const model = createMockModel([purl]);
        const scan = createMockScan([createMockComponent(purl, 'EOL', new Date())]);

        // Act
        process.env.SHOW_OK = 'false';
        const rows = await prepareRows(model, scan);

        // Assert
        assert.equal(rows.length, 1);
        assert.equal(rows[0].status, 'EOL');
      });

      it('should exclude lines when a purl from the sbom model is not present in a scan components Map', async () => {
        // Arrange
        const model = createMockModel(['pkg:npm/test@1.0.0']);
        const scan = createMockScan([createMockComponent('pkg:npm/other@1.0.0')]);

        // Act
        process.env.SHOW_OK = 'false';
        const rows = await prepareRows(model, scan);

        // Assert
        assert.equal(rows.length, 0);
      });

      it('should print a debug statement when a purl from the sbom model is not present in a scan components Map', async () => {
        // Arrange
        const purl = 'pkg:npm/test@1.0.0';
        const model = createMockModel([purl]);
        const scan = createMockScan([]);

        // Act
        process.env.SHOW_OK = 'false';
        const rows = await prepareRows(model, scan);

        // Assert
        assert.equal(rows.length, 0);
      });
    });
  });
});
