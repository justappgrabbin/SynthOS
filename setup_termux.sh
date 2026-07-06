#!/bin/bash
# Synthia Setup Script for Termux
# This installs dependencies and sets up the environment

echo "🌙 Setting up Synthia on Termux..."

# Update packages
pkg update -y

# Install Python and pip
pkg install python -y

# Install required Python packages
pip install schedule apscheduler

# Create directory structure
mkdir -p data/agents
mkdir -p phase_3_translation
mkdir -p phase_6_evolution

# Copy files (user should place them in the same directory)
echo "📁 Please ensure these files are in the current directory:"
echo "   - fso_orchestrator.py"
echo "   - synthia_body_bridge.py"
echo "   - synthia_intent_engine.py"
echo "   - synthia.py"

echo ""
echo "🌙 Synthia is ready!"
echo "   Run: python synthia.py --mode interactive"
echo "   Or:  python synthia.py --mode demo"
