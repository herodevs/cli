#!/usr/bin/env bash

set -e          # Exit immediately if a command exits with a non-zero status
set -u          # Treat unset variables as an error
set -o pipefail # Catch errors in piped commands

# Function to show usage
usage() {
  cat <<EOF
Usage: $(basename "$0") -v <version> -a <action> [--release]

Options:
  -v, --version <version>         Set the release version (required)
  -a, --action <add|delete|full>    Choose the action:
                                        add     -- Create and push a new tag
                                        delete  -- Delete an existing tag
                                        full    -- Delete and recreate the tag (requires confirmation)
  --release                       Actually perform the actions (default is dry-run)
  -h, --help                      Show this help message

Examples:
  # Dry run (default) - shows what would happen
  $(basename "$0") -v 1.2.3-beta.1 -a full

  # Actually perform the actions
  $(basename "$0") -v 1.2.3-beta.1 -a full --release

  # Valid version formats:
  #   Latest:    1.2.3
  #   Beta:      1.2.3-beta.1
  #   Alpha:     1.2.3-alpha.1
  #   Next:      1.2.3-next.1
EOF
  exit 1
}

# Function to print error message and exit
error_exit() {
  echo "Error: $1" >&2
  exit 1
}

# Ensure a subcommand is provided
if [[ "$#" -lt 1 ]]; then
  usage
fi

# Initialize variables
VERSION=""
ACTION=""
DRY_RUN=true

# Parse arguments
while [[ "$#" -gt 0 ]]; do
  case "$1" in
  -v | --version)
    VERSION="$2"
    shift 2
    ;;
  -a | --action)
    ACTION="$2"
    shift 2
    ;;
  --release)
    DRY_RUN=false
    shift
    ;;
  -h | --help)
    usage
    ;;
  *)
    error_exit "Unknown option: $1"
    ;;
  esac
done

# Ensure a version is provided
if [[ -z "$VERSION" ]]; then
  error_exit "Version is required. Use -v <version>"
fi

# Ensure a valid action is provided
if [[ -z "$ACTION" ]]; then
  error_exit "Action is required. Use -a <add|delete|full>"
fi

if [[ "$ACTION" != "add" && "$ACTION" != "delete" && "$ACTION" != "full" ]]; then
  error_exit "Invalid action '$ACTION'. Use -a <add|delete|full>"
fi

# Function to detect release channel from version
detect_release_channel() {
  if [[ "$VERSION" =~ -beta\. ]]; then
    echo "beta"
  elif [[ "$VERSION" =~ -alpha\. ]]; then
    echo "alpha"
  elif [[ "$VERSION" =~ -next\. ]]; then
    echo "next"
  else
    echo "latest"
  fi
}

# Get version from package.json
PACKAGE_JSON_VERSION=$(jq -r '.version' package.json)

# Detect release channel
RELEASE_CHANNEL=$(detect_release_channel)

# Ensure the tag version matches the package.json version
if [[ "$VERSION" != "$PACKAGE_JSON_VERSION" ]]; then
  error_exit "Version mismatch: package.json has version $PACKAGE_JSON_VERSION but you specified $VERSION"
fi

# Check if tag exists and handle based on action
if [ -n "$(git tag -l "v$VERSION")" ]; then
  if [[ "$ACTION" == "add" ]]; then
    error_exit "Tag v$VERSION already exists. Use --action delete to remove it first, or --action full to recreate it."
  elif [[ "$ACTION" == "delete" || "$ACTION" == "full" ]]; then
    echo "Note: Tag v$VERSION exists and will be removed (locally and remotely) as part of the $ACTION action."
  fi
fi

validate_tag_version() {
  # Ensure the version follows semantic versioning
  if [[ ! "$VERSION" =~ ^[0-9]+(\.[0-9]+){2}(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$ ]]; then
    error_exit "Invalid version format: '$VERSION'. Expected format: MAJOR.MINOR.PATCH (e.g., 1.2.3) || MAJOR.MINOR.PATCH-{prerelease}.VERSION (e.g., 1.2.3-beta.1)"
  fi
}

confirm_tag_version() {
  read -r -p "Version set to ${VERSION}. Is this correct? (y/N) " confirm
  if [[ "$confirm" != 'y' && "$confirm" != "Y" ]]; then
    echo "Aborted."
    exit 1
  fi
}

confirm_full_release() {
  if [[ "$ACTION" == "full" ]]; then
    read -r -p "WARNING: This will delete and recreate the tag 'v${VERSION}'. Are you sure? (y/N) " confirm
    if [[ "$confirm" != 'y' && "$confirm" != "Y" ]]; then
      echo "Aborted."
      exit 1
    fi
  fi
}

validate_tag_version
confirm_tag_version

if [ "$DRY_RUN" = false ]; then
  confirm_full_release
fi

add() {
  echo "Adding tag v${VERSION}..."
  echo "Release channel: $RELEASE_CHANNEL"

  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would create and push tag v${VERSION} with message: 'Release v${VERSION} ($RELEASE_CHANNEL channel)'"
  else
    git tag -s -a "v${VERSION}" -m "Release v${VERSION} ($RELEASE_CHANNEL channel)"
    git push origin tag "v${VERSION}"
  fi
}

delete() {
  echo "Deleting tag v${VERSION}..."

  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would delete tag v${VERSION} locally and remotely"
  else
    set +e # Temporarily disable immediate exit on error
    git tag -d "v${VERSION}" 2>/dev/null || echo "WARNING: Local tag 'v${VERSION}' not found."
    git push --delete origin "v${VERSION}" 2>/dev/null || echo "WARNING: Remote tag 'v${VERSION}' not found."
    set -e # Re-enable strict error handling
  fi
}

case "$ACTION" in
add)
  add
  ;;
delete)
  delete
  ;;
full)
  echo "Performing full action for v${VERSION}..."
  delete
  add
  ;;
esac

echo "Action '$ACTION' completed successfully for version v${VERSION}."
