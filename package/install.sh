#!/usr/bin/env bash

# Default version to latest
VERSION=${1:-latest}

# Detect OS/arch
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# Map to our artifact names
if [ "$OS" = "darwin" ]; then
  if [ "$ARCH" = "arm64" ]; then
    PLATFORM="darwin-arm64"
  else
    PLATFORM="darwin-x64"
  fi
elif [ "$OS" = "linux" ]; then
  PLATFORM="linux-x64"
elif [ "$OS" = "windows_nt" ] || [ "$OS" = "msys_nt-10.0" ]; then
  PLATFORM="win32-x64"
else
  echo "Unsupported platform: $OS $ARCH"
  exit 1
fi

# Create temp directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Download and extract
echo "Downloading hd CLI $VERSION for $OS $ARCH..."
if [ "$OS" = "windows_nt" ] || [ "$OS" = "msys_nt-10.0" ]; then
  # Windows needs special handling
  curl -L "https://end-of-life-dataset-cli-releases.s3.amazonaws.com/channels/$VERSION/hd-v$VERSION-$PLATFORM.tar.gz" -o hd.tar.gz
  tar xzf hd.tar.gz

  # Ensure the target directory exists
  mkdir -p "$LOCALAPPDATA/Programs/hd"

  # Move the binary to the correct location
  if [ -f "hd/bin/hd.exe" ]; then
    mv "hd/bin/hd.exe" "$LOCALAPPDATA/Programs/hd/hd.exe"
  else
    echo "Error: Could not find hd.exe in the downloaded package"
    exit 1
  fi

  # Add to Windows PATH if not already present
  if [[ ":$PATH:" != *":$LOCALAPPDATA/Programs/hd:"* ]]; then
    echo "Adding hd to Windows PATH..."
    # Use PowerShell to update the system PATH
    powershell -Command "[Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path', [EnvironmentVariableTarget]::User) + ';$LOCALAPPDATA/Programs/hd', [EnvironmentVariableTarget]::User)"
    echo "Please restart your terminal for PATH changes to take effect."
  fi
else
  # Unix-like systems
  curl -L "https://end-of-life-dataset-cli-releases.s3.amazonaws.com/channels/$VERSION/hd-v$VERSION-$PLATFORM.tar.gz" | tar xz
  mkdir -p /usr/local/bin
  mv hd/bin/hd /usr/local/bin/hd
  chmod +x /usr/local/bin/hd

  # Add to PATH if not already present
  if [[ ":$PATH:" != *":/usr/local/bin:"* ]]; then
    echo "Adding /usr/local/bin to PATH..."
    # Update .zshrc if it exists
    if [ -f ~/.zshrc ]; then
      if ! grep -q "export PATH=\"/usr/local/bin:\$PATH\"" ~/.zshrc; then
        echo 'export PATH="/usr/local/bin:$PATH"' >>~/.zshrc
      fi
    fi
    # Update .bashrc if it exists
    if [ -f ~/.bashrc ]; then
      if ! grep -q "export PATH=\"/usr/local/bin:\$PATH\"" ~/.bashrc; then
        echo 'export PATH="/usr/local/bin:$PATH"' >>~/.bashrc
      fi
    fi
    echo "Please restart your terminal for PATH changes to take effect."
  fi
fi

# Cleanup
cd - >/dev/null
rm -rf "$TEMP_DIR"

echo "Installation complete! Run 'hd --help' to get started."
