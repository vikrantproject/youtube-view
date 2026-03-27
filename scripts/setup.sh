#!/bin/bash

# YouTube View Automation - Setup Script
# For Ubuntu 22.04 VPS

set -e

echo "========================================"
echo "  YouTube Automation System Setup"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Ubuntu
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [ "$ID" != "ubuntu" ]; then
        echo -e "${RED}This script is designed for Ubuntu. Detected: $ID${NC}"
        echo "Continue anyway? (y/n)"
        read -r response
        if [ "$response" != "y" ]; then
            exit 1
        fi
    fi
fi

echo -e "${GREEN}Step 1: Installing system dependencies...${NC}"
sudo apt-get update
sudo apt-get install -y curl wget git build-essential software-properties-common

# Install Node.js 18
echo -e "${GREEN}Step 2: Installing Node.js 18...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${YELLOW}Node.js version $NODE_VERSION found. Upgrading to v18...${NC}"
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo -e "${GREEN}Node.js $(node -v) already installed${NC}"
    fi
fi

# Install Yarn
echo -e "${GREEN}Step 3: Installing Yarn...${NC}"
if ! command -v yarn &> /dev/null; then
    sudo npm install -g yarn
else
    echo -e "${GREEN}Yarn already installed${NC}"
fi

# Install Python 3.11
echo -e "${GREEN}Step 4: Checking Python...${NC}"
if ! command -v python3.11 &> /dev/null; then
    echo -e "${YELLOW}Python 3.11 not found. Please install it manually.${NC}"
else
    echo -e "${GREEN}Python $(python3.11 --version) found${NC}"
fi

# Install pip
echo -e "${GREEN}Step 5: Installing pip...${NC}"
sudo apt-get install -y python3-pip

# Install Docker
echo -e "${GREEN}Step 6: Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
else
    echo -e "${GREEN}Docker already installed${NC}"
fi

# Install Docker Compose
echo -e "${GREEN}Step 7: Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo -e "${GREEN}Docker Compose already installed${NC}"
fi

# Install MongoDB
echo -e "${GREEN}Step 8: Installing MongoDB...${NC}"
if ! command -v mongod &> /dev/null; then
    wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    sudo apt-get update
    sudo apt-get install -y mongodb-org
    sudo systemctl start mongod
    sudo systemctl enable mongod
else
    echo -e "${GREEN}MongoDB already installed${NC}"
fi

# Install Redis
echo -e "${GREEN}Step 9: Installing Redis...${NC}"
if ! command -v redis-server &> /dev/null; then
    sudo apt-get install -y redis-server
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
else
    echo -e "${GREEN}Redis already installed${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Base System Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Install Cloudflare WARP: sudo bash scripts/warp-install.sh"
echo "2. Install backend dependencies: cd backend && pip install -r requirements.txt"
echo "3. Install frontend dependencies: cd frontend && yarn install"
echo "4. Configure .env files in backend/ and frontend/"
echo "5. Start the application"
echo ""
