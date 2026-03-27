#!/bin/bash

# YouTube View Automation - WARP Installation Script
# For Ubuntu 22.04

set -e

echo "========================================"
echo "  Cloudflare WARP Installation"
echo "========================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root or with sudo"
    exit 1
fi

# Add Cloudflare GPG key
echo "Adding Cloudflare GPG key..."
curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg

# Add Cloudflare repository
echo "Adding Cloudflare repository..."
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/cloudflare-client.list

# Update package list
echo "Updating package list..."
apt-get update

# Install WARP
echo "Installing Cloudflare WARP..."
apt-get install -y cloudflare-warp

# Register WARP
echo "Registering WARP..."
warp-cli registration new 2>/dev/null || echo "WARP already registered"

# Set mode to WARP (not WARP+)
echo "Setting WARP mode..."
warp-cli mode warp 2>/dev/null || true

# Connect to WARP
echo "Connecting to WARP..."
warp-cli connect

# Wait for connection
echo "Waiting for WARP to connect..."
sleep 5

# Check status
echo ""
echo "WARP Status:"
warp-cli status

# Test IPv6
echo ""
echo "Testing IPv6 connectivity..."
IPV6=$(curl -6 -s icanhazip.com 2>/dev/null || echo "IPv6 not available")
echo "Your IPv6 address: $IPV6"

echo ""
echo "========================================"
echo "  WARP Installation Complete!"
echo "========================================"
echo ""
echo "Commands:"
echo "  warp-cli status       - Check connection status"
echo "  warp-cli connect      - Connect to WARP"
echo "  warp-cli disconnect   - Disconnect from WARP"
echo "  warp-cli settings     - View settings"
echo ""
