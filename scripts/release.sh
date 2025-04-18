#!/bin/bash

# Stricter shell controls
set -eu

# Default values
RELEASE_TYPE="beta"
DRY_RUN=true

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

# Execute the command
$CMD

# If not dry run, show next steps
if [ "$DRY_RUN" = false ]; then
  echo ""
  echo "✅ Release changes have been committed locally"
  echo ""
  echo "Next steps:"
  echo "1. Review the changes:"
  echo "   git show"
  echo "2. Push the tag to trigger the release workflow:"
  echo "   git push --follow-tags"
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
