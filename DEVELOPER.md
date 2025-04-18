# Developer Guide

## Release Process

### Current Process (Tag-based Releases)

The CLI currently uses tag-based releases managed through `.github/workflows/manual-release.yml`. To create a release:

1. Run one of the following npm commands:
   - `npm run release:dry-run` - Test the release process without making changes
   - `npm run release:publish:beta` - Create and publish a beta release
   - `npm run release:publish:latest` - Create and publish a latest release

2. The workflow will:
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
