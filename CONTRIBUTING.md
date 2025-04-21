# Contributing

## Release Process

### Current Process (Branch-based Releases)

The CLI uses a branch-based release process managed through `.github/workflows/manual-release.yml`. To create a release:

1. Run one of the following npm commands:
   - `npm run release` - Test the release process without making changes (--dry-run by default)
   - `npm run release:publish:beta` - Create and publish a beta release
   - `npm run release:publish:latest` - Create and publish a latest release

2. The script will:
   - Create a new release branch (format: `release-{type}-{timestamp}`)
   - Run commit-and-tag-version to bump version and create tag
   - Create a PR for the release changes
   - Wait for PR review and merge
   - After PR merge, push the tag to trigger the release workflow

3. The release workflow will:
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
