import assert from 'node:assert';
import { describe, it } from 'node:test';
import { PackageURL } from 'packageurl-js';
import { resolvePurlPackageName } from '../../src/service/eol/eol.svc.ts';

describe('eol.svc', () => {
  describe('resolvePurlPackageName', () => {
    for (const { purl, expected, description } of [
      // npm tests
      {
        purl: 'pkg:npm/%40angular/core@17.3.0',
        expected: '@angular/core',
        description: 'npm with namespace',
      },
      {
        purl: 'pkg:npm/lodash@4.17.21',
        expected: 'lodash',
        description: 'npm without namespace',
      },
      {
        purl: 'pkg:npm/express@4.18.2',
        expected: 'express',
        description: 'simple npm package',
      },
      // maven tests
      {
        purl: 'pkg:maven/org.springframework/spring-core@5.3.0',
        expected: 'org.springframework:spring-core',
        description: 'maven with group and artifact ids',
      },
      {
        purl: 'pkg:maven/org.junit/junit@4.13.2',
        expected: 'org.junit:junit',
        description: 'maven with different group and artifact ids',
      },
      // pypi tests
      {
        purl: 'pkg:pypi/Django@4.2.0',
        expected: 'django',
        description: 'pypi package (converts to lowercase)',
      },
      {
        purl: 'pkg:pypi/requests@2.28.0',
        expected: 'requests',
        description: 'pypi package (already lowercase)',
      },
      {
        purl: 'pkg:pypi/numpy@1.24.3',
        expected: 'numpy',
        description: 'simple pypi package',
      },
      // golang tests
      {
        purl: 'pkg:golang/github.com/gorilla/mux@v1.8.0',
        expected: 'github.com/gorilla/mux',
        description: 'golang with full path',
      },
      {
        purl: 'pkg:golang/go.uber.org/zap@v1.24.0',
        expected: 'go.uber.org/zap',
        description: 'golang with organization path',
      },
      // docker tests
      {
        purl: 'pkg:docker/library/nginx@1.19',
        expected: 'library/nginx',
        description: 'docker with namespace',
      },
      {
        purl: 'pkg:docker/nginx@1.19',
        expected: 'nginx',
        description: 'docker without namespace',
      },
      {
        purl: 'pkg:docker/redis@7.0',
        expected: 'redis',
        description: 'simple docker image',
      },
      // nuget tests
      {
        purl: 'pkg:nuget/Newtonsoft.Json@13.0.1',
        expected: 'Newtonsoft.Json',
        description: 'nuget package with dot',
      },
      {
        purl: 'pkg:nuget/Serilog@3.0.1',
        expected: 'Serilog',
        description: 'simple nuget package',
      },
      // composer tests
      {
        purl: 'pkg:composer/laravel/framework@8.0.0',
        expected: 'laravel/framework',
        description: 'composer with vendor',
      },
      {
        purl: 'pkg:composer/monolog/monolog@3.3.1',
        expected: 'monolog/monolog',
        description: 'simple composer package',
      },
      // gem tests
      {
        purl: 'pkg:gem/rails@7.0.4',
        expected: 'rails',
        description: 'simple ruby gem',
      },
      {
        purl: 'pkg:gem/nokogiri@1.14.3',
        expected: 'nokogiri',
        description: 'another simple ruby gem',
      },
      // cargo tests
      {
        purl: 'pkg:cargo/serde@1.0.160',
        expected: 'serde',
        description: 'simple rust crate',
      },
      {
        purl: 'pkg:cargo/tokio@1.28.0',
        expected: 'tokio',
        description: 'another simple rust crate',
      },
      // Unicode test
      {
        purl: 'pkg:npm/パッケージ@1.0.0',
        expected: 'パッケージ',
        description: 'package with non-ASCII characters',
      },
      // unknown ecosystem test
      {
        purl: 'pkg:unknown/some-package@1.0.0',
        expected: 'some-package',
        description: 'unknown ecosystem falls back to name',
      },
    ]) {
      it(`resolves ${description}`, () => {
        const packageUrl = PackageURL.fromString(purl);
        const result = resolvePurlPackageName(packageUrl);
        assert.equal(result, expected);
      });
    }
  });
});
