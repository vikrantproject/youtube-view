from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import socketio
import asyncio
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Import services
from services.browser_service import BrowserService
from services.queue_service import QueueService
from services.warp_service import WarpService
from services.stats_service import StatsService

# Initialize services
browser_service = BrowserService()
warp_service = WarpService()
queue_service = QueueService(db, sio, browser_service, warp_service)
stats_service = StatsService(db)

# Job Status Enum
class JobStatus(str, Enum):
    QUEUED = "queued"
    WATCHING = "watching"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

# Models
class JobCreate(BaseModel):
    videoUrl: str
    duration: Optional[int] = None
    priority: int = 5

class Job(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    videoUrl: str
    videoTitle: Optional[str] = None
    videoThumbnail: Optional[str] = None
    videoDuration: Optional[int] = None
    status: JobStatus = JobStatus.QUEUED
    progress: int = 0
    sessionNumber: Optional[int] = None
    ipv6Address: Optional[str] = None
    priority: int = 5
    retryCount: int = 0
    errorMessage: Optional[str] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    startedAt: Optional[datetime] = None
    completedAt: Optional[datetime] = None

class StatsResponse(BaseModel):
    totalWatched: int
    totalFailed: int
    successRate: float
    activeJobs: int
    queuedJobs: int
    totalWatchTime: int
    averageWatchTime: float

# WebSocket event handlers
@sio.event
async def connect(sid, environ):
    logging.info(f"Client connected: {sid}")
    await sio.emit('connection', {'status': 'connected'}, room=sid)

@sio.event
async def disconnect(sid):
    logging.info(f"Client disconnected: {sid}")

@sio.event
async def subscribe(sid, data):
    room = data.get('room')
    if room:
        await sio.enter_room(sid, room)
        logging.info(f"Client {sid} subscribed to {room}")

# API Routes
@api_router.get("/")
async def root():
    return {"message": "YouTube Automation API v1.0", "status": "running"}

@api_router.post("/jobs", response_model=Job)
async def create_job(job_data: JobCreate):
    """Create a new video watching job"""
    try:
        job = await queue_service.add_job(job_data)
        return job
    except Exception as e:
        logging.error(f"Error creating job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/jobs", response_model=List[Job])
async def get_jobs(
    status: Optional[JobStatus] = None,
    limit: int = 50,
    offset: int = 0
):
    """Get all jobs with optional filtering"""
    try:
        query = {}
        if status:
            query['status'] = status.value
        
        jobs = await db.jobs.find(query, {"_id": 0}).sort("createdAt", -1).skip(offset).limit(limit).to_list(limit)
        
        # Convert ISO strings to datetime
        for job in jobs:
            if isinstance(job.get('createdAt'), str):
                job['createdAt'] = datetime.fromisoformat(job['createdAt'])
            if isinstance(job.get('startedAt'), str):
                job['startedAt'] = datetime.fromisoformat(job['startedAt'])
            if isinstance(job.get('completedAt'), str):
                job['completedAt'] = datetime.fromisoformat(job['completedAt'])
        
        return jobs
    except Exception as e:
        logging.error(f"Error getting jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/jobs/{job_id}", response_model=Job)
async def get_job(job_id: str):
    """Get a specific job by ID"""
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Convert ISO strings to datetime
    if isinstance(job.get('createdAt'), str):
        job['createdAt'] = datetime.fromisoformat(job['createdAt'])
    if isinstance(job.get('startedAt'), str):
        job['startedAt'] = datetime.fromisoformat(job['startedAt'])
    if isinstance(job.get('completedAt'), str):
        job['completedAt'] = datetime.fromisoformat(job['completedAt'])
    
    return job

@api_router.delete("/jobs/{job_id}")
async def cancel_job(job_id: str):
    """Cancel a job"""
    try:
        await queue_service.cancel_job(job_id)
        return {"success": True, "message": "Job cancelled"}
    except Exception as e:
        logging.error(f"Error cancelling job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.patch("/jobs/{job_id}/pause")
async def pause_job(job_id: str):
    """Pause a job"""
    try:
        await queue_service.pause_job(job_id)
        return {"success": True, "message": "Job paused"}
    except Exception as e:
        logging.error(f"Error pausing job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.patch("/jobs/{job_id}/resume")
async def resume_job(job_id: str):
    """Resume a paused job"""
    try:
        await queue_service.resume_job(job_id)
        return {"success": True, "message": "Job resumed"}
    except Exception as e:
        logging.error(f"Error resuming job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Get system statistics"""
    try:
        stats = await stats_service.get_stats()
        return stats
    except Exception as e:
        logging.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/warp/status")
async def get_warp_status():
    """Get WARP connection status"""
    try:
        status = await warp_service.get_pool_status()
        return {"success": True, "data": status}
    except Exception as e:
        logging.error(f"Error getting WARP status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/warp/rotate/{session_number}")
async def rotate_warp(session_number: int):
    """Rotate IPv6 for a session"""
    try:
        new_ipv6 = await warp_service.rotate_ipv6(session_number)
        return {"success": True, "ipv6": new_ipv6}
    except Exception as e:
        logging.error(f"Error rotating WARP: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "database": "ok",
            "queue": "ok",
            "warp": "ok"
        }
    }

# Include router
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Socket.IO
socket_app = socketio.ASGIApp(sio, app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting YouTube Automation System...")
    await warp_service.initialize()
    await queue_service.start_workers()
    logger.info("System ready!")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down...")
    await queue_service.stop_workers()
    client.close()
