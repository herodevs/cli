# `hd install` plan

`hd install` should automate NES package installation for customers who already have package
registry access. The command runs a short-lived local npm registry proxy, executes a plain
`npm install`, and lets npm write `node_modules` and `package-lock.json` from the metadata it
receives.

Keep this file as the durable implementation guide. Detailed behavior belongs in code and tests.

## Goals

- Install entitled NES npm packages when npm resolves a catalog-matched OSS package.
- Pass through packages that cannot be safely replaced.
- Report exact catalog-matched NES packages that were not installed because registry access failed.
- Preserve npm behavior: do not rewrite `package.json`, `package-lock.json`, or `.npmrc`.
- Keep tokens out of config files, logs, generated docs, and test fixtures.

## Current slice

- `src/commands/install.ts` owns command orchestration, auth checks, proxy lifecycle, npm execution, analytics, and the final summary.
- `src/service/install/catalog.svc.ts` loads `https://api.nes.herodevs.com/api/catalog/packages?type=npm` once and indexes OSS npm package versions to catalog-provided NES package versions.
- `src/service/install/proxy-server.svc.ts` starts a local Fastify proxy. Ordinary requests pass through to public npm. Catalog-matched metadata requests fetch NES manifests, synthesize OSS-looking metadata, and expose stable NES tarball URLs.
- `src/service/install/npm-runner.svc.ts` runs exactly `npm install` with `NPM_CONFIG_REGISTRY` pointed at the local proxy.
- `src/service/install/registry-auth.svc.ts` documents and enforces the current registry-auth limitation: `hd auth login` proves API identity but does not expose a usable npm registry credential.
- `src/service/install/install-summary.svc.ts` aggregates matched NES packages, not-entitled opportunities, and EOL/no-NES opportunities.

Do not add npm argument forwarding yet. For now `hd install` means exactly `npm install`.

## Command flow

1. Parse `hd install`; there are no install-specific flags and no forwarded npm args.
2. Require the existing CLI-managed HeroDevs OAuth session.
3. Fetch the npm catalog and build an in-memory package index.
4. Resolve NES registry auth:
   - Prefer `HD_INSTALL_NPM_REGISTRY_AUTH_TOKEN` when present.
   - Without the override, fail with a clear message because the API cannot currently derive a registry-valid secret from `hd auth login`.
5. Start the proxy on `127.0.0.1` with port `0`.
6. Spawn `npm install` with only the child process environment changed.
7. Let the proxy classify package metadata requests while npm runs.
8. Close the proxy in `finally`.
9. Print a concise install summary, emit aggregate analytics, and exit with npm's exit code when npm fails.

## Registry auth facts

Research on 2026-05-27 established:

- `hd auth login` stores a JWT for HeroDevs APIs. That JWT is not accepted by the npm registry.
- `iamV2.access.getOrgAccessTokens` returns JWT access/refresh tokens. Those tokens are not accepted by the npm registry.
- The npm registry accepts opaque/PAT-style licensing access-group tokens, for example tokens associated with the `NES Access Token Provider` integration.
- Licensing access groups are associated with the IAM principal tenant organization, not necessarily the EOL setup organization returned by `ensureUserSetup()`.
- The licensing API can list access groups and token masks, but it does not expose existing token secrets through normal queries.
- `licensing.groups.issueToken` was tested against the current registry flow and the newly issued credential was not accepted for `@neverendingsupport/lodash`.
- A known valid dev registry token successfully fetched `https://registry.dev.nes.herodevs.com/npm/pkg/%40neverendingsupport/lodash`.

Current consequence: `hd install` cannot derive registry access from `hd auth login` alone. Use
`HD_INSTALL_NPM_REGISTRY_AUTH_TOKEN` for real registry tests until there is a supported API for
obtaining an npm-registry-valid credential.

## Environment overrides

- `HD_INSTALL_NPM_REGISTRY_URL` overrides the NES registry base URL. Use it for local/e2e/dev registry tests only.
- `HD_INSTALL_NPM_REGISTRY_AUTH_TOKEN` supplies the registry-valid token for NES manifest and tarball requests. Use it for local/e2e/dev registry tests and current manual real-registry validation.
- `HD_INSTALL_CATALOG_URL` overrides the catalog API URL. Use it for local/e2e tests only.

These are intentionally not user-facing command flags in this slice.

## Package decisions

For each package metadata request, classify the package into one outcome:

- `install-nes`: the requested OSS package/version matches catalog data, a compatible NES package exists, and the registry token can fetch its NES manifest. Return OSS-looking metadata whose `dist.tarball` points at the stable NES registry tarball URL.
- `available-not-entitled`: a compatible NES package exists, but the registry returns `401` or `403`. Pass through to public npm and include the exact NES package in the post-install summary.
- `eol-no-nes`: the package is EOL and no compatible NES remediation exists. Pass through and include it in the post-install remediation opportunity summary.
- `pass-through`: the package is outside catalog/EOL scope, belongs to a custom registry we should not intercept, is already a NES package request, or cannot be safely mapped.

Prefer a successful package installation over perfect reporting. If enrichment fails temporarily, pass through and report what is known.

## Registry and metadata behavior

- Never attach HeroDevs credentials to a request just because npm called the local proxy. Match the requested package against the catalog first.
- Preserve the NES registry base path; `https://registry.nes.herodevs.com/npm/pkg` is not just a host.
- Treat NES registry `401` and `403` responses as not entitled.
- Use the catalog's latest NES version for each OSS version; do not request NES metadata using the raw OSS version.
- Preserve NES manifest fields such as dependencies, peer dependencies, engines, dist integrity, and tarball URLs. Override only the public package name/version needed for npm resolution.
- Return final stable tarball URLs in metadata. npm should write the lockfile by itself.
- Existing OSS lockfiles with absolute npmjs `resolved` URLs may not re-resolve through the proxy during plain `npm install`; replacing those safely requires a separate design, not ad hoc lockfile editing.
- Keep tarball responses streaming. Do not buffer large tarballs unless a future feature truly requires rewriting them.
- Do not intercept packages already configured for a private/custom registry once detection exists.

## Known registry and catalog facts

- The private npm registry is mounted under `/npm`; package metadata is served from `/npm/pkg/:pkg` and `/npm/pkg/:org/:pkg`.
- Tarballs are served from `/npm/pkg/:org/:pkg/-/:version.tgz`.
- The catalog source of truth is `https://api.nes.herodevs.com/api/catalog/packages`; `?type=npm` filters it to npm packages.
- As of 2026-05-27, the npm catalog exposes OSS version, NES purl/version, products, CVEs, and compatibility ranges, but not full npm manifest metadata such as dependencies.
- Existing catalog tooling maps OSS versions to NES versions using `version.oss.compatibility` ranges shaped like `{ lower, upper }`, interpreted as `>= lower < upper`.
- Do not correct catalog package-name mistakes in the CLI. If npm asks for a package name that is not an exact catalog match, pass it through and fix bad OSS identities in the catalog.

## Performance constraints

- Fetch npm catalog data once per install run where possible, using bounded parallel page loading.
- Cache NES manifests and package decisions for the duration of the command.
- Avoid NES registry calls for packages outside catalog scope.
- Preserve npm's concurrency; the proxy must handle concurrent metadata and tarball requests.
- Defer non-critical analytics and opportunity reporting until after npm exits, or keep it bounded.

## Testing strategy

- Unit test catalog matching, registry-auth failure modes, manifest synthesis, summary aggregation, and npm runner behavior.
- Use Fastify `app.inject()` for proxy route tests that do not need a real port.
- Keep command tests mocked so they verify lifecycle and exit behavior without running real npm.
- Keep E2E tests customer-shaped: copy a fixture project, run the real `hd install`, serve package metadata/tarballs from a local mock registry, and assert `node_modules` plus `package-lock.json`.

## Deferred

- Supported API or OAuth flow for retrieving an npm-registry-valid credential.
- Forwarding npm args or supporting package-manager flags.
- Persisting package manager configuration or editing `package.json`.
- Yarn and pnpm support.
- Custom registry detection.
- Sending full gathered install data to a dedicated analytics API.
