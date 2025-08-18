#!/usr/bin/env sh
set -eu

SCAN_DIR="${GITHUB_WORKSPACE:-$PWD}"
SCAN_DIR="$(cd "$SCAN_DIR" 2>/dev/null && pwd || echo "$SCAN_DIR")"

# Verify the working dir (or GHA workspace) is a mount
if ! grep -q " $SCAN_DIR " /proc/self/mountinfo 2>/dev/null; then
  echo "No volume mounted to scan. To run with your project mounted:" >&2
  echo "  docker run --rm -v \"\$PWD\":/app ghcr.io/herodevs/eol-scan [--flags]" >&2
  exit 1
fi

cd "$SCAN_DIR"
exec hd scan eol "$@"