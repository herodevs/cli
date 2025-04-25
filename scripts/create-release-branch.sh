#!/bin/bash

# Stricter shell controls
set -eu

# Default values
RELEASE_TYPE="beta"
DRY_RUN=true

# Check for required tools
if ! command -v gh &>/dev/null; then
  echo "Error: GitHub CLI (gh) is not installed."
  echo "Please install it from https://cli.github.com/"
  exit 1
fi

echo "🔍 Debug: Initial values"
echo "  RELEASE_TYPE=$RELEASE_TYPE"
echo "  DRY_RUN=$DRY_RUN"
echo ""

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

echo "🔍 Debug: After parsing arguments"
echo "  RELEASE_TYPE=$RELEASE_TYPE"
echo "  DRY_RUN=$DRY_RUN"
echo ""

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: You have uncommitted changes. Please commit or stash them before releasing."
  exit 1
fi

# Build the commit-and-tag-version command
CMD="npx commit-and-tag-version"

# Add release type
if [ "$RELEASE_TYPE" = "latest" ]; then
  # No flag needed for latest
  true
else
  CMD="$CMD --prerelease $RELEASE_TYPE"
fi

# Add dry run if specified
if [ "$DRY_RUN" = true ]; then
  CMD="$CMD --dry-run"
fi

echo "🔍 Debug: Final command"
echo "  $CMD"
echo ""

echo "Creating $RELEASE_TYPE release..."
echo "Running: $CMD"

if [ "$DRY_RUN" = false ]; then
  # Ensure we're on main branch
  CURRENT_BRANCH=$(git branch --show-current)
  if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "Switching to main branch..."
    git switch main
  fi

  # Fetch latest changes
  echo "Fetching latest changes..."
  git fetch origin main

  # Create release branch with timestamp
  TIMESTAMP=$(date +%Y%m%d%H%M%S)
  RELEASE_BRANCH="release-$RELEASE_TYPE-$TIMESTAMP"
  echo "Creating release branch: $RELEASE_BRANCH"
  git switch -c "$RELEASE_BRANCH" origin/main
fi

# Execute the command
$CMD

if [ "$DRY_RUN" = false ]; then
  # Get the most recent tag
  TAG_NAME=$(git describe --tags --abbrev=0)

  echo ""
  echo "✅ Release changes have been committed locally"
  echo ""

  # Push the branch to remote
  echo "Pushing release branch to remote..."
  git push -u origin "$RELEASE_BRANCH"

  # Create PR using gh CLI
  echo "Creating pull request..."
  PR_TITLE="chore: release $TAG_NAME"
  PR_BODY="Release As $TAG_NAME"

  gh pr create \
    --title "$PR_TITLE" \
    --body "$PR_BODY" \
    --base main \
    --head "$RELEASE_BRANCH"

  echo ""
  echo "Next steps:"
  echo "1. Wait for the PR to be reviewed and merged"
  echo "2. After PR is merged, push the tag to trigger the release workflow:"
  echo "   git push origin $TAG_NAME"
  echo ""
  echo "The GitHub Actions release workflow will run once the tag is pushed."
else
  echo ""
  echo "✅ DRY RUN COMPLETED"
  echo "This was a dry run - no changes were made to the repository."
  echo "To actually publish this release, run:"
  echo "  npm run release:publish:beta    # for a beta release"
  echo "  npm run release:publish:latest  # for a latest release"
fi
