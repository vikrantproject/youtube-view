#!/bin/bash

# GitHub Repository Setup and Push Script
# Repository: youtube-view-1 (Private)

set -e

GITHUB_USERNAME="vikrant-project"
GITHUB_TOKEN="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"
REPO_NAME="youtube-view-1"

echo "========================================"
echo "  GitHub Setup: $REPO_NAME"
echo "========================================"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Git is not installed. Installing..."
    sudo apt-get update && sudo apt-get install -y git
fi

# Initialize git if not already
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
    git config user.name "$GITHUB_USERNAME"
    git config user.email "${GITHUB_USERNAME}@users.noreply.github.com"
fi

# Create .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
    echo "Creating .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual environments
venv/
env/
ENV/
.venv

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/
.pytest_cache/

# Build output
build/
dist/
.next/
out/

# Browser automation
.playwright/
test-results/
playwright-report/

# Database
*.db
*.sqlite
*.sqlite3

# Misc
.cache/
*.pid
*.seed
*.pid.lock
EOF
fi

# Create README.md if it doesn't exist
if [ ! -f README.md ]; then
    echo "Creating README.md..."
    cat > README.md << 'EOF'
# 🎥 YouTube View Automation System

> **Production-Ready Full-Stack Application with AI-Powered Automation**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)
[![Python Version](https://img.shields.io/badge/python-3.11-blue)](requirements.txt)

## ✨ Features

- 🔄 **10 Parallel Sessions** - Watch multiple videos simultaneously
- 🌐 **Unique IPv6 per Session** - Cloudflare WARP integration
- 🎨 **Modern UI** - Neumorphism + Glassmorphism design
- 📡 **Real-Time Updates** - WebSocket live monitoring
- 📏 **Smart Queue** - Priority-based job management
- 📈 **Analytics** - Comprehensive statistics tracking

## 🛠️ Tech Stack

### Backend
- FastAPI (Python)
- Socket.IO for WebSockets
- Playwright for browser automation
- MongoDB for data storage
- Redis for queue management

### Frontend
- React 19
- Framer Motion for animations
- Zustand for state management
- Tailwind CSS + Custom Neumorphic design
- Phosphor Icons

## 🚀 Quick Start

### Prerequisites
- Ubuntu 22.04 (recommended)
- Node.js >= 18
- Python 3.11
- MongoDB
- Redis

### Installation

1. **Clone Repository**
```bash
git clone https://github.com/vikrant-project/youtube-view-1.git
cd youtube-view-1
```

2. **Run Setup Script**
```bash
chmod +x scripts/setup.sh
sudo bash scripts/setup.sh
```

3. **Install Cloudflare WARP**
```bash
chmod +x scripts/warp-install.sh
sudo bash scripts/warp-install.sh
```

4. **Configure Environment**
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your settings

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with your backend URL
```

5. **Install Dependencies**
```bash
# Backend
cd backend
pip install -r requirements.txt
playwright install chromium

# Frontend
cd ../frontend
yarn install
```

6. **Start Services**
```bash
# Backend (port 7899)
cd backend
uvicorn server:socket_app --host 0.0.0.0 --port 7899

# Frontend (port 2578)
cd frontend
yarn start
```

7. **Access Application**
- Frontend: http://localhost:2578
- Backend API: http://localhost:7899/api

## 📚 API Documentation

### Endpoints

#### Jobs
- `POST /api/jobs` - Create new job
- `GET /api/jobs` - List all jobs
- `GET /api/jobs/:id` - Get job details
- `DELETE /api/jobs/:id` - Cancel job
- `PATCH /api/jobs/:id/pause` - Pause job
- `PATCH /api/jobs/:id/resume` - Resume job

#### Statistics
- `GET /api/stats` - Get system statistics

#### WARP
- `GET /api/warp/status` - WARP connection status
- `POST /api/warp/rotate/:sessionNumber` - Rotate IPv6

#### Health
- `GET /api/health` - Health check

### WebSocket Events

**Client → Server**
- `subscribe` - Subscribe to job updates

**Server → Client**
- `job:created` - New job created
- `job:started` - Job started watching
- `job:progress` - Progress update
- `job:completed` - Job completed
- `job:failed` - Job failed
- `job:paused` - Job paused
- `job:resumed` - Job resumed
- `job:cancelled` - Job cancelled

## ⚠️ Disclaimer

**EDUCATIONAL USE ONLY**

This tool is provided strictly for educational and research purposes. Users are solely responsible for:
- Compliance with YouTube's Terms of Service
- Compliance with applicable laws and regulations
- Respecting content creator rights

The authors and contributors:
- Assume no liability for misuse
- Do not endorse violations of terms of service
- Provide this software "as is" without warranty

**Use at your own risk.**

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details

## 👥 Contributors

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📞 Support

- 🐛 [Report Bug](https://github.com/vikrant-project/youtube-view-1/issues)
- 💡 [Request Feature](https://github.com/vikrant-project/youtube-view-1/issues)
- 💬 [Discussions](https://github.com/vikrant-project/youtube-view-1/discussions)

---

**Made with ❤️ for Educational Purposes**
EOF
fi

# Check if repository exists on GitHub
echo "Checking if repository exists on GitHub..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/repos/$GITHUB_USERNAME/$REPO_NAME")

if [ "$RESPONSE" = "404" ]; then
    echo "Repository doesn't exist. Creating private repository..."
    curl -s -X POST \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/user/repos \
        -d "{\"name\":\"$REPO_NAME\",\"private\":true,\"description\":\"YouTube View Automation System - Educational Use Only\"}"
    echo ""
    echo "Repository created successfully!"
else
    echo "Repository already exists."
fi

# Add remote if not exists
if ! git remote | grep -q origin; then
    echo "Adding remote origin..."
    git remote add origin "https://$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/$REPO_NAME.git"
else
    echo "Setting remote origin URL..."
    git remote set-url origin "https://$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/$REPO_NAME.git"
fi

# Stage all files
echo "Staging files..."
git add .

# Commit
echo "Committing changes..."
git commit -m "Initial commit: YouTube View Automation System" || echo "No changes to commit"

# Create main branch if on master
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "master" ]; then
    echo "Renaming branch to main..."
    git branch -M main
fi

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main --force

echo ""
echo "========================================"
echo "  ✅ Successfully pushed to GitHub!"
echo "========================================"
echo ""
echo "Repository: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo "Status: Private"
echo ""
