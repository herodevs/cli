#!/bin/bash

# Exit on error
set -e

# Default values
RELEASE_TYPE="beta"
DRY_RUN=true

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
  --latest)
    RELEASE_TYPE="latest"
    shift
    ;;
  --beta)
    RELEASE_TYPE="beta"
    shift
    ;;
  --alpha)
    RELEASE_TYPE="alpha"
    shift
    ;;
  --next)
    RELEASE_TYPE="next"
    shift
    ;;
  --publish)
    DRY_RUN=false
    shift
    ;;
  --help)
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  --latest   Create a latest release (default is beta)"
    echo "  --beta     Create a beta release (default)"
    echo "  --alpha    Create an alpha release"
    echo "  --next     Create a next release"
    echo "  --publish  Actually create and push the release (default is dry-run)"
    echo "  --help     Show this help message"
    exit 0
    ;;
  *)
    echo "Unknown option: $1"
    echo "Use --help for usage information"
    exit 1
    ;;
  esac
done

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: You have uncommitted changes. Please commit or stash them before releasing."
  exit 1
fi

# Build the commit-and-tag-version command
CMD="npx commit-and-tag-version"

# Add release type if not latest
if [ "$RELEASE_TYPE" != "latest" ]; then
  CMD="$CMD --$RELEASE_TYPE"
fi

# Add dry run if specified
if [ "$DRY_RUN" = true ]; then
  CMD="$CMD --dry-run"
fi

echo "Creating $RELEASE_TYPE release..."
echo "Running: $CMD"

# Execute the command
$CMD

# If not dry run, ask for confirmation before publishing
if [ "$DRY_RUN" = false ]; then
  echo ""
  echo "⚠️  WARNING: This will perform the following actions:"
  echo "  1. Update version in package.json"
  echo "  2. Update CHANGELOG.md with latest changes"
  echo "  3. Create a commit with these changes"
  echo "  4. Create a git tag for the new version"
  echo "  5. Push both the commit and tag to the remote repository"
  echo ""
  echo "This will trigger the GitHub Actions release workflow."
  echo ""
  read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Release cancelled."
    exit 1
  fi

  echo "Pushing tag..."
  git push --follow-tags
fi

echo "Release process completed!"
