import asyncio
import logging
from typing import Dict, Optional
from datetime import datetime, timezone
import uuid

logger = logging.getLogger(__name__)

class QueueService:
    """Service to manage job queue and workers"""
    
    def __init__(self, db, sio, browser_service, warp_service):
        self.db = db
        self.sio = sio
        self.browser_service = browser_service
        self.warp_service = warp_service
        self.active_jobs: Dict[str, Dict] = {}
        self.workers_running = False
        self.worker_tasks = []

    async def add_job(self, job_data):
        """Add a new job to the queue"""
        try:
            job_dict = {
                'id': str(uuid.uuid4()),
                'videoUrl': job_data.videoUrl,
                'videoTitle': None,
                'videoThumbnail': None,
                'videoDuration': job_data.duration,
                'status': 'queued',
                'progress': 0,
                'sessionNumber': None,
                'ipv6Address': None,
                'priority': job_data.priority,
                'retryCount': 0,
                'errorMessage': None,
                'createdAt': datetime.now(timezone.utc).isoformat(),
                'startedAt': None,
                'completedAt': None
            }
            
            await self.db.jobs.insert_one(job_dict)
            
            # Emit job created event
            await self.sio.emit('job:created', {
                'jobId': job_dict['id'],
                'videoUrl': job_dict['videoUrl'],
                'status': 'queued'
            }, room='jobs')
            
            logger.info(f"Job created: {job_dict['id']}")
            return job_dict
            
        except Exception as e:
            logger.error(f"Error adding job: {e}")
            raise

    async def start_workers(self):
        """Start worker tasks"""
        self.workers_running = True
        
        # Start 10 worker tasks
        for i in range(10):
            task = asyncio.create_task(self._worker(i + 1))
            self.worker_tasks.append(task)
        
        logger.info("Started 10 worker tasks")

    async def stop_workers(self):
        """Stop all workers"""
        self.workers_running = False
        
        for task in self.worker_tasks:
            task.cancel()
        
        await asyncio.gather(*self.worker_tasks, return_exceptions=True)
        logger.info("Stopped all workers")

    async def _worker(self, worker_id: int):
        """Worker task to process jobs"""
        logger.info(f"Worker {worker_id} started")
        
        while self.workers_running:
            try:
                # Get available session
                session_number = self.warp_service.get_available_session()
                
                if not session_number:
                    await asyncio.sleep(5)
                    continue
                
                # Get next job from queue
                job = await self.db.jobs.find_one_and_update(
                    {'status': 'queued'},
                    {'$set': {
                        'status': 'watching',
                        'sessionNumber': session_number,
                        'startedAt': datetime.now(timezone.utc).isoformat()
                    }},
                    sort=[('priority', -1), ('createdAt', 1)]
                )
                
                if not job:
                    await asyncio.sleep(2)
                    continue
                
                # Process the job
                await self._process_job(job, session_number)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Worker {worker_id} error: {e}")
                await asyncio.sleep(5)

    async def _process_job(self, job: Dict, session_number: int):
        """Process a single job"""
        job_id = job['id']
        
        try:
            # Get IPv6 for session
            ipv6 = await self.warp_service.get_ipv6_for_session(session_number)
            
            # Update job with IPv6
            await self.db.jobs.update_one(
                {'id': job_id},
                {'$set': {'ipv6Address': ipv6}}
            )
            
            # Emit job started event
            await self.sio.emit('job:started', {
                'jobId': job_id,
                'sessionNumber': session_number,
                'ipv6': ipv6,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }, room='jobs')
            
            # Launch browser
            browser = await self.browser_service.launch_browser(session_number, ipv6)
            page = await self.browser_service.create_page(browser, ipv6)
            
            # Navigate to video
            metadata = await self.browser_service.navigate_to_video(page, job['videoUrl'])
            
            # Update job with metadata
            await self.db.jobs.update_one(
                {'id': job_id},
                {'$set': {
                    'videoTitle': metadata.get('title'),
                    'videoThumbnail': metadata.get('thumbnail')
                }}
            )
            
            # Play video
            await self.browser_service.play_video(page)
            
            # Track progress
            duration = job.get('videoDuration', 300)  # Default 5 minutes
            start_time = asyncio.get_event_loop().time()
            
            while True:
                # Check if job is cancelled or paused
                current_job = await self.db.jobs.find_one({'id': job_id})
                if not current_job or current_job['status'] in ['cancelled', 'paused']:
                    break
                
                # Get progress
                progress_data = await self.browser_service.get_video_progress(page)
                progress_percentage = int(progress_data['percentage'])
                
                # Update progress
                await self.db.jobs.update_one(
                    {'id': job_id},
                    {'$set': {'progress': progress_percentage}}
                )
                
                # Emit progress event
                await self.sio.emit('job:progress', {
                    'jobId': job_id,
                    'progress': progress_percentage,
                    'currentTime': progress_data['currentTime'],
                    'duration': progress_data['duration']
                }, room='jobs')
                
                # Check if video is complete
                if progress_percentage >= 95 or (asyncio.get_event_loop().time() - start_time) >= duration:
                    break
                
                await asyncio.sleep(5)
            
            # Mark as completed
            await self.db.jobs.update_one(
                {'id': job_id},
                {'$set': {
                    'status': 'completed',
                    'progress': 100,
                    'completedAt': datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Emit completion event
            await self.sio.emit('job:completed', {
                'jobId': job_id,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }, room='jobs')
            
            logger.info(f"Job {job_id} completed successfully")
            
        except Exception as e:
            logger.error(f"Error processing job {job_id}: {e}")
            
            # Mark as failed
            await self.db.jobs.update_one(
                {'id': job_id},
                {'$set': {
                    'status': 'failed',
                    'errorMessage': str(e)
                }}
            )
            
            # Emit failure event
            await self.sio.emit('job:failed', {
                'jobId': job_id,
                'error': str(e)
            }, room='jobs')
            
        finally:
            # Cleanup
            try:
                await self.browser_service.close_browser(session_number)
            except:
                pass
            
            self.warp_service.release_session(session_number)

    async def cancel_job(self, job_id: str):
        """Cancel a job"""
        await self.db.jobs.update_one(
            {'id': job_id},
            {'$set': {'status': 'cancelled'}}
        )
        
        await self.sio.emit('job:cancelled', {'jobId': job_id}, room='jobs')
        logger.info(f"Job {job_id} cancelled")

    async def pause_job(self, job_id: str):
        """Pause a job"""
        await self.db.jobs.update_one(
            {'id': job_id},
            {'$set': {'status': 'paused'}}
        )
        
        await self.sio.emit('job:paused', {'jobId': job_id}, room='jobs')
        logger.info(f"Job {job_id} paused")

    async def resume_job(self, job_id: str):
        """Resume a paused job"""
        await self.db.jobs.update_one(
            {'id': job_id},
            {'$set': {'status': 'queued'}}
        )
        
        await self.sio.emit('job:resumed', {'jobId': job_id}, room='jobs')
        logger.info(f"Job {job_id} resumed")
