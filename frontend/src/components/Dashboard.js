import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Play, Pause, X, Eye, Plus, Video } from '@phosphor-icons/react';
import StatsGrid from './StatsGrid';
import JobCard from './JobCard';
import ActivityFeed from './ActivityFeed';
import AddVideoModal from './AddVideoModal';
import DisclaimerModal from './DisclaimerModal';
import useWebSocket from '../hooks/useWebSocket';
import useJobs from '../hooks/useJobs';
import useStats from '../hooks/useStats';
import useJobStore from '../store/jobStore';
import useSettingsStore from '../store/settingsStore';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const { jobs: initialJobs, loading: jobsLoading, refetch: refetchJobs } = useJobs();
  const { stats, refetch: refetchStats } = useStats();
  const { showDisclaimer, setShowDisclaimer } = useSettingsStore();
  
  const jobs = useJobStore((state) => state.jobs);
  const setJobs = useJobStore((state) => state.setJobs);
  const updateJob = useJobStore((state) => state.updateJob);
  const addJob = useJobStore((state) => state.addJob);
  const removeJob = useJobStore((state) => state.removeJob);
  
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (initialJobs.length > 0) {
      setJobs(initialJobs);
    }
  }, [initialJobs, setJobs]);

  const handleJobUpdate = useCallback((event, data) => {
    switch (event) {
      case 'created':
        refetchJobs();
        addActivity(`Job created for video`, 'info');
        break;
        
      case 'started':
        updateJob(data.jobId, {
          status: 'watching',
          sessionNumber: data.sessionNumber,
          ipv6Address: data.ipv6
        });
        addActivity(`Session #${data.sessionNumber} started watching`, 'success');
        break;
        
      case 'progress':
        updateJob(data.jobId, { progress: data.progress });
        break;
        
      case 'completed':
        updateJob(data.jobId, { status: 'completed', progress: 100 });
        addActivity(`Video completed successfully`, 'success');
        refetchStats();
        break;
        
      case 'failed':
        updateJob(data.jobId, { status: 'failed' });
        addActivity(`Job failed: ${data.error}`, 'error');
        refetchStats();
        break;
        
      case 'paused':
        updateJob(data.jobId, { status: 'paused' });
        addActivity(`Job paused`, 'warning');
        break;
        
      case 'resumed':
        updateJob(data.jobId, { status: 'queued' });
        addActivity(`Job resumed and queued`, 'info');
        break;
        
      case 'cancelled':
        updateJob(data.jobId, { status: 'cancelled' });
        addActivity(`Job cancelled`, 'warning');
        break;
    }
  }, [updateJob, refetchJobs, refetchStats]);

  const { connected } = useWebSocket(handleJobUpdate);

  const addActivity = (message, type = 'info') => {
    const activity = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setActivities(prev => [activity, ...prev.slice(0, 19)]);
  };

  const handleAddVideo = async (videoData) => {
    try {
      const response = await axios.post(`${API}/jobs`, videoData);
      toast.success('Video added to queue!');
      setShowAddModal(false);
      refetchJobs();
    } catch (error) {
      console.error('Error adding video:', error);
      toast.error('Failed to add video');
    }
  };

  const handlePauseJob = async (jobId) => {
    try {
      await axios.patch(`${API}/jobs/${jobId}/pause`);
      toast.success('Job paused');
    } catch (error) {
      toast.error('Failed to pause job');
    }
  };

  const handleResumeJob = async (jobId) => {
    try {
      await axios.patch(`${API}/jobs/${jobId}/resume`);
      toast.success('Job resumed');
    } catch (error) {
      toast.error('Failed to resume job');
    }
  };

  const handleCancelJob = async (jobId) => {
    try {
      await axios.delete(`${API}/jobs/${jobId}`);
      toast.success('Job cancelled');
      refetchJobs();
    } catch (error) {
      toast.error('Failed to cancel job');
    }
  };

  const activeJobs = jobs.filter(j => j.status === 'watching');
  const queuedJobs = jobs.filter(j => j.status === 'queued');

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 
                className="text-4xl md:text-5xl font-semibold mb-2" 
                style={{ 
                  fontFamily: "'Outfit', sans-serif",
                  color: 'var(--text-primary)'
                }}
                data-testid="dashboard-title"
              >
                🎥 YouTube Automation
              </h1>
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {connected ? (
                  <>
                    <span className="w-2 h-2 rounded-full pulse-dot" style={{ backgroundColor: 'var(--status-success)' }}></span>
                    <span>Live Connected</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--status-danger)' }}></span>
                    <span>Disconnected</span>
                  </>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              data-testid="add-video-button"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              style={{
                backgroundColor: 'var(--brand-primary)',
                color: 'white',
                boxShadow: '0 8px 16px rgba(0, 122, 255, 0.3)'
              }}
            >
              <Plus size={20} weight="bold" />
              Add Video
            </button>
          </div>
        </motion.header>

        {/* Stats Grid */}
        <StatsGrid stats={stats} />

        {/* Active Sessions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 
            className="text-2xl md:text-3xl font-medium mb-6" 
            style={{ 
              fontFamily: "'Outfit', sans-serif",
              color: 'var(--text-primary)'
            }}
          >
            Active Sessions ({activeJobs.length}/10)
          </h2>
          
          {jobsLoading ? (
            <div className="glass-card rounded-3xl p-12 text-center" style={{ color: 'var(--text-secondary)' }}>
              Loading sessions...
            </div>
          ) : activeJobs.length === 0 ? (
            <div 
              className="glass-card rounded-3xl p-12 text-center"
              data-testid="no-active-jobs"
            >
              <Video size={48} weight="duotone" style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>No active sessions</p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>Add a video to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {activeJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onPause={handlePauseJob}
                    onResume={handleResumeJob}
                    onCancel={handleCancelJob}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.section>

        {/* Queued Jobs */}
        {queuedJobs.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 
              className="text-2xl md:text-3xl font-medium mb-6" 
              style={{ 
                fontFamily: "'Outfit', sans-serif",
                color: 'var(--text-primary)'
              }}
            >
              Queue ({queuedJobs.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {queuedJobs.slice(0, 6).map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onPause={handlePauseJob}
                  onResume={handleResumeJob}
                  onCancel={handleCancelJob}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Activity Feed */}
        <ActivityFeed activities={activities} />
      </div>

      {/* Modals */}
      <AddVideoModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddVideo}
      />
      
      <DisclaimerModal
        isOpen={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
      />
    </div>
  );
};

export default Dashboard;
