# Deployment Guide

## 🚀 Production Deployment on Ubuntu 22.04 VPS

This guide covers deploying the YouTube View Automation System on a fresh Ubuntu 22.04 VPS.

## Prerequisites

- Ubuntu 22.04 VPS with root access
- Minimum 2GB RAM, 2 CPU cores
- 20GB disk space
- Domain name (optional, for HTTPS)

## Step-by-Step Deployment

### 1. Initial Server Setup

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install basic tools
sudo apt-get install -y curl wget git ufw

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 7899/tcp  # Backend
sudo ufw allow 2578/tcp  # Frontend
sudo ufw --force enable
```

### 2. Clone Repository

```bash
git clone https://github.com/vikrant-project/youtube-view-1.git
cd youtube-view-1
```

### 3. Run Automated Setup

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run main setup (installs Node.js, Python, MongoDB, Redis, Docker)
sudo bash scripts/setup.sh

# Install Cloudflare WARP for IPv6
sudo bash scripts/warp-install.sh
```

### 4. Configure Environment

**Backend Configuration:**

```bash
cd backend
cp .env.example .env
nano .env
```

Update with your settings:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=youtube_automation_prod
CORS_ORIGINS=https://yourdomain.com,http://your-vps-ip:2578
WARP_ENABLED=true
```

**Frontend Configuration:**

```bash
cd ../frontend
cp .env.example .env
nano .env
```

Update backend URL:
```env
REACT_APP_BACKEND_URL=http://your-vps-ip:7899
# Or with domain: https://api.yourdomain.com
```

### 5. Install Dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
playwright install chromium
```

**Frontend:**
```bash
cd ../frontend
yarn install
yarn build  # Build for production
```

### 6. Setup Process Manager (PM2)

```bash
# Install PM2
sudo npm install -g pm2

# Start backend
cd /path/to/youtube-view-1/backend
pm2 start "uvicorn server:socket_app --host 0.0.0.0 --port 7899" --name youtube-backend

# Start frontend (using serve)
sudo npm install -g serve
cd /path/to/youtube-view-1/frontend
pm2 start "serve -s build -l 2578" --name youtube-frontend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 7. Setup Nginx Reverse Proxy (Optional)

```bash
# Install Nginx
sudo apt-get install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/youtube-automation
```

Add configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:2578;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:7899;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:7899;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/youtube-automation /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. Setup SSL with Let's Encrypt (Optional)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

### 9. Setup MongoDB Authentication

```bash
# Connect to MongoDB
mongosh

# Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "your-secure-password",
  roles: [{ role: "userAdminAnyDatabase", db: "admin" }]
})

# Create application user
use youtube_automation_prod
db.createUser({
  user: "youtube_app",
  pwd: "your-app-password",
  roles: [{ role: "readWrite", db: "youtube_automation_prod" }]
})

exit
```

Update backend `.env`:
```env
MONGO_URL=mongodb://youtube_app:your-app-password@localhost:27017
```

Restart backend:
```bash
pm2 restart youtube-backend
```

### 10. Monitoring & Logs

**View Logs:**
```bash
# Backend logs
pm2 logs youtube-backend

# Frontend logs
pm2 logs youtube-frontend

# All logs
pm2 logs
```

**Monitor Resources:**
```bash
pm2 monit
```

**System Logs:**
```bash
# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MongoDB
sudo tail -f /var/log/mongodb/mongod.log
```

### 11. Backup Strategy

**Automated MongoDB Backup:**

```bash
# Create backup script
sudo nano /usr/local/bin/backup-youtube-db.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +"%Y%m%d_%H%M%S")

mkdir -p $BACKUP_DIR
mongodump --db youtube_automation_prod --out $BACKUP_DIR/backup_$DATE

# Keep only last 7 days
find $BACKUP_DIR -mtime +7 -exec rm -rf {} \;
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/backup-youtube-db.sh
```

Add to crontab:
```bash
sudo crontab -e

# Add line (backup daily at 2 AM)
0 2 * * * /usr/local/bin/backup-youtube-db.sh
```

### 12. Security Hardening

**Firewall:**
```bash
# Lock down MongoDB (only localhost)
sudo ufw deny 27017/tcp

# Lock down Redis (only localhost)
sudo ufw deny 6379/tcp
```

**MongoDB Configuration:**
```bash
sudo nano /etc/mongod.conf
```

Ensure:
```yaml
net:
  bindIp: 127.0.0.1

security:
  authorization: enabled
```

Restart:
```bash
sudo systemctl restart mongod
```

**Rate Limiting (Optional):**

Add to Nginx config:
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api {
    limit_req zone=api burst=20;
    # ... rest of config
}
```

## 🔧 Maintenance

### Update Application

```bash
cd /path/to/youtube-view-1

# Pull latest changes
git pull origin main

# Update backend
cd backend
pip install -r requirements.txt
pm2 restart youtube-backend

# Update frontend
cd ../frontend
yarn install
yarn build
pm2 restart youtube-frontend
```

### Scale Workers

The system uses 10 parallel workers by default. To change this, modify `backend/services/warp_service.py`:

```python
self.max_sessions = 20  # Increase to 20 workers
```

And `backend/services/queue_service.py`:

```python
for i in range(20):  # Start 20 worker tasks
```

**Note:** More workers = more resources needed.

### Troubleshooting

**Backend not starting:**
```bash
pm2 logs youtube-backend --lines 100

# Check port
sudo netstat -tulpn | grep 7899
```

**Frontend not accessible:**
```bash
pm2 logs youtube-frontend --lines 100

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
```

**MongoDB connection issues:**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Test connection
mongosh
```

**WARP not connecting:**
```bash
# Check WARP status
warp-cli status

# Reconnect
warp-cli disconnect
warp-cli connect
```

## 📊 Performance Optimization

### 1. MongoDB Indexing

```javascript
// Connect to MongoDB
mongosh

use youtube_automation_prod

// Create indexes
db.jobs.createIndex({ "status": 1 })
db.jobs.createIndex({ "createdAt": -1 })
db.jobs.createIndex({ "sessionNumber": 1 })
db.jobs.createIndex({ "status": 1, "priority": -1, "createdAt": 1 })
```

### 2. Enable Gzip Compression

In Nginx config:
```nginx
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
gzip_min_length 256;
```

### 3. Frontend Caching

Add to Nginx config:
```nginx
location /static {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## ✅ Health Checks

**Backend Health:**
```bash
curl http://localhost:7899/api/health
```

**Frontend Health:**
```bash
curl -I http://localhost:2578
```

**MongoDB Health:**
```bash
mongosh --eval "db.adminCommand('ping')"
```

**WARP Health:**
```bash
warp-cli status
```

## 📞 Support

If you encounter issues during deployment:

1. Check logs first (`pm2 logs`)
2. Verify all services are running (`pm2 status`)
3. Check firewall rules (`sudo ufw status`)
4. Review [GitHub Issues](https://github.com/vikrant-project/youtube-view-1/issues)
5. Open a new issue with:
   - Error logs
   - System information
   - Steps to reproduce

---

**Deployment Complete! 🎉**

Your YouTube Automation System should now be running in production.
