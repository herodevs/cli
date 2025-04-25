#!/usr/bin/env bash

set -e          # Exit immediately if a command exits with a non-zero status
set -u          # Treat unset variables as an error
set -o pipefail # Catch errors in piped commands

# Function to show usage
usage() {
  cat <<EOF
Usage: $(basename "$0") -v <version> -a <action>

Options:
  -v, --version <version>         Set the release version (required)
  -a, --action <add|delete|full>    Choose the action:
                                        add     -- Create and push a new tag
                                        delete  -- Delete an existing tag
                                        full    -- Delete and recreate the tag (requires confirmation)
  -h, --help                      Show this help message

Examples:
  $(basename "$0") -v 1.2.3 -a add
  $(basename "$0") -v 1.2.3 -a delete
  $(basename "$0") -v 1.2.3 -a full
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
    -h | --help)
      usage
      ;;
    *)
      error_exit "Unknown option: $1"
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

validate_tag_version() {
  # Ensure the version follows semantic versioning: MAJOR.MINOR.PATCH (e.g., 1.2.3)
  if [[ ! "$VERSION" =~ ^[0-9]+(\.[0-9]+){2}$ ]]; then
    error_exit "Invalid version format: '$VERSION'. Expected format: MAJOR.MINOR.PATCH (e.g., 1.2.3)"
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
confirm_full_release

add () {
  echo "Adding tag v${VERSION}..."

  git tag -s -a "v${VERSION}" -m "Release v${VERSION}"
  git push origin tag "v${VERSION}"
}

delete () {
  echo "Deleting tag v${VERSION}..."
  set +e  # Temporarily disable immediate exit on error

  git tag -d "v${VERSION}" 2>/dev/null || echo "WARNING: Local tag 'v${VERSION}' not found."
  git push --delete origin "v${VERSION}" 2>/dev/null || echo "WARNING: Remote tag 'v${VERSION}' not found."

  set -e  # Re-enable strict error handling
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
