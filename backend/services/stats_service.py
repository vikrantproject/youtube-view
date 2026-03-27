import logging
from typing import Dict
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class StatsService:
    """Service to calculate and track statistics"""
    
    def __init__(self, db):
        self.db = db

    async def get_stats(self) -> Dict:
        """Get current system statistics"""
        try:
            # Count jobs by status
            total_watched = await self.db.jobs.count_documents({'status': 'completed'})
            total_failed = await self.db.jobs.count_documents({'status': 'failed'})
            active_jobs = await self.db.jobs.count_documents({'status': 'watching'})
            queued_jobs = await self.db.jobs.count_documents({'status': 'queued'})
            
            # Calculate success rate
            total_finished = total_watched + total_failed
            success_rate = (total_watched / total_finished * 100) if total_finished > 0 else 100.0
            
            # Get completed jobs for watch time calculation
            completed_jobs = await self.db.jobs.find(
                {'status': 'completed'},
                {'startedAt': 1, 'completedAt': 1}
            ).to_list(1000)
            
            # Calculate watch time
            total_watch_time = 0
            for job in completed_jobs:
                if job.get('startedAt') and job.get('completedAt'):
                    try:
                        started = datetime.fromisoformat(job['startedAt']) if isinstance(job['startedAt'], str) else job['startedAt']
                        completed = datetime.fromisoformat(job['completedAt']) if isinstance(job['completedAt'], str) else job['completedAt']
                        watch_time = (completed - started).total_seconds()
                        total_watch_time += watch_time
                    except:
                        pass
            
            average_watch_time = total_watch_time / total_watched if total_watched > 0 else 0
            
            return {
                'totalWatched': total_watched,
                'totalFailed': total_failed,
                'successRate': round(success_rate, 2),
                'activeJobs': active_jobs,
                'queuedJobs': queued_jobs,
                'totalWatchTime': int(total_watch_time),
                'averageWatchTime': round(average_watch_time, 2)
            }
            
        except Exception as e:
            logger.error(f"Error calculating stats: {e}")
            return {
                'totalWatched': 0,
                'totalFailed': 0,
                'successRate': 0,
                'activeJobs': 0,
                'queuedJobs': 0,
                'totalWatchTime': 0,
                'averageWatchTime': 0
            }
