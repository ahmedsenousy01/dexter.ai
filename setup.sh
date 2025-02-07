#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "🔍 Checking and installing dependencies..."

# --- uv installation ---
if command_exists uv; then
    echo "✅ uv is already installed"
else
    echo "📦 Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    # It's recommended to open a new terminal or run 'source ~/.bashrc' for uv to be available in PATH.
    # However, 'source ~/.bashrc' here might not be reliable in all environments.
    # For better reliability, instruct the user to open a new terminal or manually source their shell config.
    echo "⚠️  Please open a new terminal or run 'source ~/.bashrc' to ensure uv is in your PATH."
fi

# --- Python installation using uv ---
if command_exists python; then
    echo "✅ Python is already installed"
else
    echo "📦 Installing Python using uv..."
    # Note: 'uv python install' installs Python in the current virtual environment if one exists.
    # If no virtual environment is active, it might install a global Python, or behave unexpectedly.
    # Verify 'uv python install' behavior based on your uv version and desired Python installation method.
    uv python install
fi

# --- Initialize UV project in agent directory ---
if [ ! -f "agent/uv.lock" ]; then
    echo "📦 Initializing UV project in agent directory..."
    cd agent
    uv init
    cd .. # Go back to the project root
else
    echo "✅ UV project already initialized in agent directory"
fi

# --- nvm installation ---
if [ -d "$HOME/.nvm" ]; then
    echo "✅ nvm is already installed"
else
    echo "📦 Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    # Similar to uv, nvm might require a new terminal or sourcing shell config.
    echo "⚠️  Please open a new terminal or run 'source ~/.bashrc' or 'source ~/.zshrc' (depending on your shell) to ensure nvm is in your PATH."
fi

# --- Load nvm ---
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"
# Note: Loading nvm in a script might have limitations compared to loading it in shell config files.
# For robust nvm loading, consider adding nvm loading commands to your ~/.bashrc or ~/.zshrc.

# --- Install Node.js LTS using nvm ---
if command_exists node; then
    current_version=$(node -v | cut -d 'v' -f2)
    echo "📊 Current Node.js version: v${current_version}"

    # Force update to Node.js 22 LTS if current version is less than v22.0.0
    if [[ "$(printf '%s\n' "22.0.0" "${current_version}" | sort -V | head -n1)" == "${current_version}" ]]; then
        echo "🔄 Current Node.js version is outdated. Installing Node.js 22 LTS..."
        nvm install 22
        nvm use 22
        nvm alias default 22
    else
        echo "✅ Node.js version is compatible (>= v22.0.0)"
    fi
else
    echo "📦 Installing Node.js 22 LTS..."
    nvm install 22
    nvm use 22
    nvm alias default 22
fi

# --- Verify Node.js installation ---
node_version=$(node -v)
echo "✅ Using Node.js version: ${node_version}"

# --- Disable corepack and setup pnpm ---
echo "🔧 Configuring package manager..."
corepack disable  # Disable corepack to avoid signature verification issues
npm uninstall -g corepack  # Remove corepack completely

# --- Check/Install pnpm using npm ---
if command_exists pnpm; then
    echo "✅ pnpm is already installed"
else
    echo "📦 Installing pnpm using npm..."
    npm install -g pnpm@latest
fi

# Verify pnpm installation
pnpm_version=$(pnpm --version)
echo "✅ Using pnpm version: ${pnpm_version}"

echo "🚀 Installing project dependencies..."

# --- Install dependencies for Next.js frontend ---
echo "📦 Setting up Next.js project..."
cd web
pnpm install
cd .. # Go back to the project root

# --- Install dependencies for Hono backend ---
echo "📦 Setting up Hono project..."
cd server
pnpm install
cd .. # Go back to the project root

# --- Install dependencies for LangGraph agent ---
echo "📦 Setting up LangGraph agent..."
cd agent
uv sync --all-extras
cd .. # Go back to the project root

echo "✨ All dependencies installed successfully!"
echo "🚀 Starting the project..."
pnpm start:all
