#!/bin/bash
set -e

echo "Installing development tools..."

# Function to check command status
check_status() {
  if [ $? -eq 0 ]; then
    echo "✅ $1 installed successfully!"
  else
    echo "❌ $1 installation failed!"
    exit 1
  fi
}

# Install Rust
echo "Installing Rust..."
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
rustc --version > /dev/null 2>&1
check_status "Rust"

# Install NVM
echo "Installing NVM..."
export NVM_DIR="$HOME/.nvm"
if [ ! -d "$NVM_DIR" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
fi

# Source NVM regardless of whether it was just installed or already existed
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Check if NVM is available
command -v nvm > /dev/null 2>&1
check_status "NVM"

# Install Node.js v20
echo "Installing Node.js v20..."
nvm install 20
nvm use 20
nvm alias default 20
node --version | grep -q "v20"
check_status "Node.js v20"

# Install uv
echo "Installing uv..."
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
uv --version > /dev/null 2>&1
check_status "uv"

echo "All tools installed successfully!"
echo "Please restart your terminal or run 'source ~/.bashrc' (or ~/.zshrc) to use the installed tools." 
