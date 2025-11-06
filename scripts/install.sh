#!/usr/bin/env bash
set -e          # Exit immediately if a command exits with a non-zero status
set -u          # Treat unset variables as an error
set -o pipefail # Catch errors in piped commands

#=============================================================================
# HeroDevs CLI Installer
#
# This script installs the HeroDevs CLI by downloading the appropriate tarball
# from GitHub releases and setting it up for use on macOS and Linux systems.
#
# Design Decisions:
# - Bootstrap pattern: Initial install via GitHub. Plan to add S3 support in the future for auto-updates.
# - Symlink architecture: Separates executable path from installation files
# - Non-root approach: User-level installation without admin privileges
# - Shell compatibility: Works with Bash 3+ (macOS default and Linux)
#
# Security Considerations:
# - HTTPS downloads for all components
# - Timeout controls for network operations
# - Proper cleanup of temporary files
# - Error handling for failed operations
#
# Usage:
#   Beta release:  curl -sSfL https://raw.githubusercontent.com/herodevs/cli/refs/heads/main/scripts/install.sh | bash
#   Latest release: curl -sSfL https://raw.githubusercontent.com/herodevs/cli/refs/heads/main/scripts/install.sh | bash -s -- --latest
#=============================================================================

# Configuration
REPO_OWNER="herodevs"
REPO_NAME="cli"
BIN_NAME="hd"
INSTALL_DIR="$HOME/.herodevs"
BIN_DIR="$INSTALL_DIR/bin"
GITHUB_API_URL="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases"
TMP_DIR=""
USE_BETA=true
# LATEST_VERSION="v2.0.0-beta.13"
DEBUG=${DEBUG:-}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
PURPLE='\033[38;5;140m'
BLUE='\033[0;34m'
NC='\033[0m'  # No Color

# Initialize logging system
# Save original stdout to FD 3 so we can use it for program output
exec 3>&1

# Central logging function
log() {
  local level="$1"
  local message="$2"
  local timestamp
  timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  
  # All logs go to stderr (FD 2)
  case "$level" in
    INFO)    echo -e "${timestamp} ${GREEN}[INFO]${NC} $message" >&2 ;;
    WARNING) echo -e "${timestamp} ${YELLOW}[WARNING]${NC} $message" >&2 ;;
    ERROR)   echo -e "${timestamp} ${RED}[ERROR]${NC} $message" >&2 ;;
    DEBUG)   
      if [ -n "$DEBUG" ]; then
        echo -e "${timestamp} ${BLUE}[DEBUG]${NC} $message" >&2
      fi
      ;;
  esac
}

# Function to output data (not logs) to the original stdout
emit() {
  echo "$@" >&3
}

# Function to exit with error
error_exit() {
  log "ERROR" "$1"
  exit 1
}

# Parse arguments
while [ $# -gt 0 ]; do
  case $1 in
  -l | --latest)
    USE_BETA=false
    shift
    ;;
  -h | --help)
    # Help text goes to the original stdout
    emit "Usage: $0 [-l|--latest]"
    emit "  -l, --latest    Install latest release (default: install beta)"
    emit "  -h, --help      Show this help message"
    exit 0
    ;;
  *)
    error_exit "Unknown option: $1"
    ;;
  esac
done

# Cleanup on exit/interrupt
cleanup() {
  if [ -n "$TMP_DIR" ] && [ -d "$TMP_DIR" ]; then
    log "DEBUG" "Cleaning up temporary directory: $TMP_DIR"
    rm -rf "$TMP_DIR"
  fi
}

trap cleanup EXIT INT TERM

log "INFO" "Installing HeroDevs CLI"

# Get release version (beta or latest)
get_version() {
  local use_beta="$1"
  local releases_data="$2"

  log "INFO" "Extracting release version"
  local all_tags
  local latest_release
  local beta_release
  local version_tag
  
  # Split complex command chains for Bash 3 compatibility
  all_tags=$(echo "$releases_data" | grep -o '"tag_name": "[^"]*"')
  all_tags=$(echo "$all_tags" | cut -d'"' -f4)
  
  # Get latest non-beta release
  latest_release=$(echo "$all_tags" | grep -v "beta" | head -n 1)
  
  # Get latest beta release
  beta_release=$(echo "$all_tags" | grep "beta" | head -n 1)

  log "DEBUG" "All tags: $all_tags"
  log "DEBUG" "Latest release: $latest_release"
  log "DEBUG" "Beta release: $beta_release"

  if [ "$use_beta" = "true" ]; then
    version_tag="$beta_release"
    if [ -z "$version_tag" ]; then
      log "ERROR" "No beta release found. Please try again later or use --latest to install the latest stable release."
      exit 1
    fi
  else
    version_tag="$latest_release"
    if [ -z "$version_tag" ]; then
      error_exit "No latest release found. Please try again later."
    fi
  fi

  log "INFO" "Using version: $version_tag"
  # Output actual return value to the original stdout (FD 3)
  emit "$version_tag"
}

# Download and install
install() {
  # Fetch releases from GitHub
  releases=$(curl --silent --connect-timeout 10 --max-time 30 "$GITHUB_API_URL" 2>&1)
  curl_exit=$?

  if [ $curl_exit -ne 0 ]; then
    error_exit "Failed to fetch releases from GitHub API: $releases"
  fi

  # Validate the response is not empty
  if [ -z "$releases" ]; then
    error_exit "Empty response from GitHub API. Please try again later."
  fi

  # Ensure the response contains release data
  if ! echo "$releases" | grep -q '"tag_name"'; then
    error_exit "Invalid response from GitHub API. Please try again later."
  fi

  # Determine VERSION_TAG
  VERSION_TAG=$(get_version "$USE_BETA" "$releases" 3>&1 1>&2)

  local version_tag="$VERSION_TAG"
  
  # Remove 'v' prefix if present
  local version
  version=${version_tag#v}
  
  log "DEBUG" "Version string: $version"

  # Detect system
  local os
  local arch
  
  os=$(uname -s | tr '[:upper:]' '[:lower:]')
  arch=$(uname -m)
  
  if [ "$arch" = "x86_64" ]; then 
    arch="x64"
  fi
  if [ "$arch" = "aarch64" ]; then 
    arch="arm64"
  fi
  
  log "INFO" "Detected system: $os-$arch"

  # Construct OS-ARCH pattern
  pattern="${os}-${arch}"

  # Extract all browser_download_url values for the matching release
  release_block=$(echo "$releases" | awk -v tag="\"$VERSION_TAG\"" '
    BEGIN {found=0; block=""}
    $0 ~ tag {found=1}
    found {
      block = block $0 "\n"
      if ($0 ~ /^\s*\],?$/) { found=0; print block; exit }
    }
  ')

  # Parse browser_download_url from release_block and check against pattern
  download_url=""
  while read -r url; do
    if echo "$url" | grep -qi "$pattern"; then
      download_url="$url"
      break
    fi
  done < <(echo "$release_block" | grep '"browser_download_url":' | sed -E 's/.*"browser_download_url": "([^"]+)".*/\1/')

  # Ensure we found a matching asset
  if [ -z "$download_url" ]; then
    error_exit "No release found system $pattern for release $VERSION_TAG"
  fi

  log "DEBUG" "Download URL: $download_url"

  log "INFO" "Downloading and installing tarball"

  local tarball_name="${REPO_NAME}-${version}-${os}-${arch}.tar.gz"

  # Check for existing installation
  if [ -d "$INSTALL_DIR" ]; then
    log "INFO" "Updating existing installation in $INSTALL_DIR"
  else
    log "INFO" "Installing to $INSTALL_DIR"
    mkdir -p "$INSTALL_DIR"
  fi

  mkdir -p "$BIN_DIR"

  # Create temp dir and download
  TMP_DIR=$(mktemp -d)
  log "INFO" "Downloading ${os}-${arch} tarball..."
  log "DEBUG" "Using temporary directory: $TMP_DIR"

  # Split command and capture output separately for Bash 3 compatibility
  local curl_output
  curl_output=$(curl -L --connect-timeout 10 --max-time 120 "$download_url" -o "$TMP_DIR/$tarball_name" 2>&1)
  local curl_status=$?
  
  if [ $curl_status -ne 0 ]; then
    error_exit "Failed to download from $download_url: $curl_output"
  fi

  # Extract and set up
  log "INFO" "Extracting..."
  tar -xzf "$TMP_DIR/$tarball_name" -C "$INSTALL_DIR"
  local tar_status=$?
  
  if [ $tar_status -ne 0 ]; then
    error_exit "Failed to extract tarball"
  fi

  # Create symlink in bin directory
  log "DEBUG" "Creating symlink from $INSTALL_DIR/$BIN_NAME to $BIN_DIR/$BIN_NAME"
  ln -sf "$INSTALL_DIR/$BIN_NAME/bin/hd" "$BIN_DIR/$BIN_NAME"

  # Add to PATH if needed
  if ! echo "$PATH" | tr ':' '\n' | grep -q "^$BIN_DIR$"; then
    log "DEBUG" "BIN_DIR not found in PATH, adding it"
    
    local profile_file=""
    if [ -f "$HOME/.zshrc" ]; then
      profile_file="$HOME/.zshrc"
    elif [ -f "$HOME/.bashrc" ]; then
      profile_file="$HOME/.bashrc"
    elif [ -f "$HOME/.bash_profile" ]; then
      profile_file="$HOME/.bash_profile"
    fi

    if [ -n "$profile_file" ]; then
      echo "export PATH=\"\$PATH:$BIN_DIR\"" >> "$profile_file"
      log "INFO" "Added $BIN_DIR to PATH in $profile_file"
      log "WARNING" "Please restart your terminal or run 'source $profile_file' to update your PATH"
    else
      log "WARNING" "Could not find shell profile. Please add $BIN_DIR to your PATH manually:"
      emit "export PATH=\"$BIN_DIR:\$PATH:\""
    fi
  fi

  log "INFO" "Installation complete! You can now run: $BIN_NAME --help"
  emit "The CLI will automatically check for updates when run."
}

check_dependencies() {
  log "INFO" "Checking dependencies"
  if ! command -v curl >/dev/null 2>&1; then
    error_exit "curl is required but not installed"
  fi
  if ! command -v tar >/dev/null 2>&1; then
    error_exit "tar is required but not installed"
  fi
}

check_dependencies

install

if [ -n "$DEBUG" ]; then
  emit -e "${PURPLE}"
  emit "  ――――――――――――――――――――――――――――――――――――――――――――――――――――"
  emit "         @herodevs/cli installed 🎉🎉🎉"
  emit "                  👻"
  emit "  Finding EOL deps before they come back to haunt you"
  emit "  ――――――――――――――――――――――――――――――――――――――――――――――――――――"
  emit -e "${NC}"
fi

# Restore stdout
exec 1>&3 3>&-
