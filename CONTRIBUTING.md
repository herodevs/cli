# Contributing

## Release Process

### Current Process (Branch-based Releases)

The CLI uses a branch-based release process. To create a release:

#### Create a release branch

1. `git fetch origin main`
2. `git switch main`
3. `git pull origin main`
4. `git switch -c release-{version}` (e.g., `release-1.2.3`)
5. Manually bump version number in package.json
6. `npm i` to update package-lock
7. `npx oclif manifest && npm run readme` to update readme
8. `git add . && git commit -m "chore: release {version}"` (e.g., `chore: release 1.2.3`)
9. `git push -u origin release-{version}`
10. Create PR into main

#### Push a tag

1. Once PR is merged:
   - `git fetch origin main`
   - `git switch main`
   - `git pull origin main`
2. Run `./scripts/release-tag.sh -v {version} -a full` to push the tag

The release workflow in GitHub will then:
- Verify the tag matches the package version
- Run tests
- Build platform-specific tarballs
- Create a draft GitHub release
- Upload to S3 distribution
- Publish to npm

### Planned Process (Release Please)

After our first stable release, we plan to switch to using [Release Please](https://github.com/google-github-actions/release-please-action) for automated releases. This will:

1. Automatically create release PRs based on conventional commits
2. Handle version bumping
3. Generate changelogs
4. Create releases when PRs are merged

The Release Please configuration is already in place (`.github/workflows/release.yml` and `release-please-config.json`) but is currently disabled.

## Testing

### E2E Tests

When adding new test fixtures that include `package.json` or `package-lock.json` files, be aware that Dependabot may create PR warnings about vulnerabilities in these fixtures. To prevent this, you can add a comment in the Dependabot PR:

```markdown
@dependabot ignore this dependency
```

See [this example PR](https://github.com/herodevs/cli/pull/182#issuecomment-2812762970) for reference.
