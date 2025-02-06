#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "🔍 Checking and installing dependencies..."

# Check/Install uv first
if command_exists uv; then
    echo "✅ uv is already installed"
else
    echo "📦 Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    source ~/.bashrc  # Reload shell to get uv in PATH
fi

# Check/Install Python using uv
if command_exists python; then
    echo "✅ Python is already installed"
else
    echo "📦 Installing Python using uv..."
    # Install Python version specified in pyproject.toml
    uv python install
fi

# Initialize UV project if not already initialized
if [ ! -f "agent/uv.lock" ]; then
    echo "📦 Initializing UV project..."
    cd agent
    uv init
    cd ..
fi

# Check/Install nvm
if [ -d "$HOME/.nvm" ]; then
    echo "✅ nvm is already installed"
else
    echo "📦 Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    # Load nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    # Reload shell to get nvm in PATH
    source ~/.bashrc
fi

# Install Node.js LTS using nvm
if command_exists node; then
    echo "✅ Node.js is already installed"
else
    echo "📦 Installing Node.js LTS using nvm..."
    nvm install --lts
    nvm use --lts
fi

# Check/Install pnpm using npm
if command_exists pnpm; then
    echo "✅ pnpm is already installed"
else
    echo "📦 Installing pnpm using npm..."
    npm install -g pnpm
fi

echo "🚀 Installing project dependencies..."

# Install dependencies for Next.js frontend
echo "📦 Setting up Next.js project..."
cd web
pnpm install
cd ..

# Install dependencies for Hono backend
echo "📦 Setting up Hono project..."
cd server
pnpm install
cd ..

# Install dependencies for LangGraph agent
echo "📦 Setting up LangGraph agent..."
cd agent
uv sync --all-extras
cd ..

echo "✨ All dependencies installed successfully!"
echo "🚀 Starting the project..."
pnpm start:all 
