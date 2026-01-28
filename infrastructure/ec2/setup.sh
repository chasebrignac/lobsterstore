#!/bin/bash
# LobsterLoop EC2 AMI Setup Script
# Run this on a fresh Ubuntu 24.04 LTS instance

set -e

echo "Starting LobsterLoop EC2 setup..."

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 24
echo "Installing Node.js 24..."
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs git

# Verify installations
node --version
npm --version
git --version

# Install Claude Code CLI
echo "Installing Claude Code CLI..."
curl -fsSL https://claude.ai/install.sh | sh

# Verify Claude Code installation
claude --version || echo "Claude Code CLI installed, may need to restart shell"

# Clone Ralph repository
echo "Cloning Ralph repository..."
sudo git clone https://github.com/snarktank/ralph.git /opt/ralph
sudo chmod +x /opt/ralph/ralph.sh

# Create working directory for executions
echo "Creating execution directories..."
sudo mkdir -p /opt/lobsterloop/executions
sudo chmod 777 /opt/lobsterloop/executions

# Install SSM Agent (should be pre-installed on Ubuntu AMIs)
sudo snap install amazon-ssm-agent --classic
sudo snap start amazon-ssm-agent

echo "Setup complete!"
echo "Next steps:"
echo "1. Create an AMI from this instance"
echo "2. Use the AMI ID in your .env file (EC2_AMI_ID)"
echo "3. Terminate this instance after creating the AMI"
