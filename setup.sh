#!/bin/bash
# Quick setup and run script for GitHub repository updates

echo "🚀 GitHub Repository Update - Quick Setup"
echo "=========================================="
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install it first."
    exit 1
fi

echo "✅ Python 3 found"
echo ""

# Install requirements
echo "📦 Installing requirements..."
pip install requests -q
echo "✅ Requirements installed"
echo ""

# Create a temporary script to run with the token
cat > /tmp/run_update.py << 'EOF'
import sys
import os

# Add the script path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import and run the update script
from update_repos import main

if __name__ == "__main__":
    sys.exit(main())
EOF

echo "📝 Script ready to run!"
echo ""
echo "To execute the repository update, run:"
echo ""
echo "  export GITHUB_TOKEN='your_token_here'"
echo "  python3 update_repos.py"
echo ""
echo "Or run directly with:"
echo "  python3 update_repos.py YOUR_TOKEN_HERE"
