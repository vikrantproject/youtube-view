# 🎥 YouTube View Automation System

> **Production-Ready Full-Stack Application with AI-Powered Automation**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)
[![Python Version](https://img.shields.io/badge/python-3.11-blue)](requirements.txt)

![Dashboard Screenshot](https://via.placeholder.com/1200x600/F2F2F7/1C1C1E?text=YouTube+Automation+Dashboard)

## ✨ Features

- 🔄 **10 Parallel Sessions** - Watch multiple videos simultaneously
- 🌐 **Unique IPv6 per Session** - Cloudflare WARP integration
- 🎨 **Modern UI** - Neumorphism + Glassmorphism design
- 📡 **Real-Time Updates** - WebSocket live monitoring
- 📏 **Smart Queue** - Priority-based job management
- 📈 **Analytics** - Comprehensive statistics tracking
- 🤖 **Browser Automation** - Playwright-powered watching
- 💡 **Educational Disclaimer** - Built-in legal warnings

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Socket.IO** - Real-time WebSocket communication
- **Playwright** - Browser automation
- **MongoDB** - Database storage
- **Redis** - Job queue management (optional)
- **AsyncIO** - Asynchronous workers

### Frontend
- **React 19** - Latest React version
- **Framer Motion** - Smooth animations
- **Zustand** - Lightweight state management
- **Tailwind CSS** - Utility-first styling
- **Phosphor Icons** - Beautiful icon system
- **Socket.IO Client** - Real-time updates

## 🚀 Quick Start

### Prerequisites

- Ubuntu 22.04 (recommended)
- Node.js >= 18.0.0
- Python 3.11
- MongoDB
- Cloudflare WARP (optional, for production IPv6)

### Installation

#### 1. Clone Repository

```bash
git clone https://github.com/vikrantproject/youtube-view.git
cd youtube-view
```

#### 2. Run Setup Script (Ubuntu)

```bash
chmod +x scripts/setup.sh
sudo bash scripts/setup.sh
```

This will install:
- Node.js 18
- Python dependencies
- MongoDB
- Redis
- Docker & Docker Compose

#### 3. Install Cloudflare WARP (Optional)

```bash
chmod +x scripts/warp-install.sh
sudo bash scripts/warp-install.sh
```

**Note:** WARP provides real IPv6 addresses. Without it, the system uses mock IPv6 addresses for development.

#### 4. Install Dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
playwright install chromium
```

**Frontend:**
```bash
cd frontend
yarn install
```

#### 5. Configure Environment

**Backend (.env):**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
MONG O_URL=mongodb://localhost:27017
DB_NAME=youtube_automation
CORS_ORIGINS=*
```

**Frontend (.env):**
```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:7899
```

#### 6. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn server:socket_app --host 0.0.0.0 --port 7899 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
```

#### 7. Access Application

- **Frontend:** http://localhost:2578
- **Backend API:** http://localhost:7899/api
- **API Docs:** http://localhost:7899/docs

## 📚 Usage

### Adding a Video

1. Click the **"Add Video"** button
2. Paste a YouTube video URL
3. Set priority (0-10, higher = more priority)
4. Optionally set watch duration in seconds
5. Click **"Add to Queue"**

### Managing Jobs

- **Pause** - Pause a watching job
- **Resume** - Resume a paused job
- **Cancel** - Cancel any job

### Real-Time Monitoring

- View active sessions with live progress bars
- Monitor IPv6 addresses per session
- Track success rate and watch time
- View activity feed for all events

## 📡 API Documentation

### Base URL
```
http://localhost:7899/api
```

### Endpoints

#### Jobs

**Create Job**
```http
POST /api/jobs
Content-Type: application/json

{
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "priority": 5,
  "duration": 300
}
```

**Get All Jobs**
```http
GET /api/jobs?status=watching&limit=20&offset=0
```

**Get Job by ID**
```http
GET /api/jobs/{job_id}
```

**Cancel Job**
```http
DELETE /api/jobs/{job_id}
```

**Pause Job**
```http
PATCH /api/jobs/{job_id}/pause
```

**Resume Job**
```http
PATCH /api/jobs/{job_id}/resume
```

#### Statistics

**Get Stats**
```http
GET /api/stats
```

Response:
```json
{
  "totalWatched": 1234,
  "totalFailed": 23,
  "successRate": 98.5,
  "activeJobs": 10,
  "queuedJobs": 5,
  "totalWatchTime": 456789,
  "averageWatchTime": 370.5
}
```

#### WARP Management

**Get WARP Status**
```http
GET /api/warp/status
```

**Rotate IPv6**
```http
POST /api/warp/rotate/{session_number}
```

#### Health Check

```http
GET /api/health
```

### WebSocket Events

**Connect to WebSocket:**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:7899');

socket.on('connect', () => {
  socket.emit('subscribe', { room: 'jobs' });
});
```

**Server Events:**
- `job:created` - New job created
- `job:started` - Job started watching
- `job:progress` - Progress update (every 5 seconds)
- `job:completed` - Job completed successfully
- `job:failed` - Job failed with error
- `job:paused` - Job paused
- `job:resumed` - Job resumed
- `job:cancelled` - Job cancelled

## 🏛️ Architecture

```
┌────────────────────────────────────────┐
│          React Frontend (Port 2578)         │
│  Neumorphic UI + Real-time WebSocket Client  │
└──────────────────┬─────────────────────┘
                   │ HTTP/WebSocket
┌──────────────────┴─────────────────────┐
│         FastAPI Backend (Port 7899)         │
│  Socket.IO + REST API + AsyncIO Workers   │
└──────┬───────┬───────┬───────┬──────┘
     │       │       │       │
┌────┴───┐ ┌─┴──┐ ┌──┴───┐ ┌─┴───┐
│ MongoDB │ │ Queue│ │ WARP  │ │ Play-│
│ Storage │ │ Mgmt │ │ IPv6  │ │ wright│
└─────────┘ └─────┘ └───────┘ └───────┘
```

### Key Components

1. **Queue Service** - Manages 10 parallel workers
2. **Browser Service** - Playwright automation
3. **WARP Service** - IPv6 address pool management
4. **Stats Service** - Analytics calculation
5. **WebSocket Server** - Real-time event broadcasting

## ⚠️ Disclaimer

### **EDUCATIONAL USE ONLY**

This YouTube View Automation System is provided **strictly for educational and research purposes**.

**Important Notice:**

- ⚠️ Users are **solely responsible** for compliance with YouTube's Terms of Service
- ⚠️ Using this tool may **violate platform policies** and result in account suspension
- ⚠️ The developers **assume no liability** for misuse of this software
- ⚠️ This software is provided **"as is"** without warranty of any kind

**By using this tool, you acknowledge that you:**
1. Understand these restrictions
2. Will use it responsibly and legally
3. Accept full responsibility for any consequences
4. Will not use it to violate any terms of service

**Use at your own risk.**

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## 🐛 Known Issues

- WebSocket may disconnect on some networks (auto-reconnects)
- WARP requires root access for installation
- Playwright requires ~200MB disk space for Chromium
- Some videos may fail due to YouTube protections

## 🛣️ Roadmap

### Version 2.0
- [ ] User authentication & multi-tenancy
- [ ] Video scheduling with cron jobs
- [ ] Advanced analytics dashboard
- [ ] Export reports (CSV, PDF)
- [ ] Webhook notifications
- [ ] Team collaboration features

### Version 3.0
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] AI-powered session optimization
- [ ] Multi-platform support (Vimeo, Dailymotion)
- [ ] Kubernetes deployment

## 📞 Support

- 🐛 [Report Bug](https://github.com/vikrantproject/youtube-view/issues)
- 💡 [Request Feature](https://github.com/vikrantproject/youtube-view/issues)
- 💬 [Discussions](https://github.com/vikrantproject/youtube-view/discussions)

## 👥 Authors

- **Vikrant Project** - [@vikrantproject](https://github.com/vikrantproject)

## 🙏 Acknowledgments

- Cloudflare for WARP technology
- Playwright team for browser automation
- FastAPI for the amazing Python framework
- React team for the UI library
- All open-source contributors

---

**Made with ❤️ for Educational Purposes**

[⬆ Back to Top](#-youtube-view-automation-system)
