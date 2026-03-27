import { motion } from 'framer-motion';
import { Pause, Play, X, Globe, VideoCamera } from '@phosphor-icons/react';

const JobCard = ({ job, onPause, onResume, onCancel }) => {
  const getStatusBadge = (status) => {
    const badges = {
      queued: { label: 'Queued', color: '#8E8E93', bg: 'rgba(142, 142, 147, 0.15)' },
      watching: { label: 'Watching', color: 'var(--brand-primary)', bg: 'rgba(0, 122, 255, 0.15)' },
      paused: { label: 'Paused', color: 'var(--status-warning)', bg: 'rgba(255, 204, 0, 0.15)' },
      completed: { label: 'Completed', color: 'var(--status-success)', bg: 'rgba(52, 199, 89, 0.15)' },
      failed: { label: 'Failed', color: 'var(--status-danger)', bg: 'rgba(255, 59, 48, 0.15)' },
      cancelled: { label: 'Cancelled', color: 'var(--text-tertiary)', bg: 'rgba(199, 199, 204, 0.15)' }
    };
    return badges[status] || badges.queued;
  };

  const badge = getStatusBadge(job.status);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className="rounded-3xl p-6 border border-white/40 transition-all duration-300"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
      }}
      data-testid={`job-card-${job.id}`}
    >
      {/* Header */}
      <div className="flex gap-3 mb-4">
        {job.videoThumbnail ? (
          <img
            src={job.videoThumbnail}
            alt={job.videoTitle || 'Video'}
            className="w-24 h-16 object-cover rounded-xl flex-shrink-0"
          />
        ) : (
          <div 
            className="w-24 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(142, 142, 147, 0.1)' }}
          >
            <VideoCamera size={32} weight="duotone" style={{ color: 'var(--text-tertiary)' }} />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 
            className="font-semibold text-sm mb-2 line-clamp-2" 
            style={{ color: 'var(--text-primary)' }}
            title={job.videoTitle || job.videoUrl}
          >
            {job.videoTitle || 'Loading...'}
          </h3>
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: badge.bg,
              color: badge.color
            }}
            data-testid={`job-status-${job.id}`}
          >
            {badge.label}
          </span>
        </div>
      </div>

      {/* Meta Info */}
      {job.sessionNumber && (
        <div className="flex gap-3 mb-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex items-center gap-1.5">
            <Globe size={14} weight="duotone" />
            <code 
              className="font-mono" 
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              data-testid={`job-ipv6-${job.id}`}
            >
              {job.ipv6Address ? job.ipv6Address.substring(0, 19) + '...' : 'N/A'}
            </code>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🎯 Session #{job.sessionNumber}</span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {job.status === 'watching' || job.status === 'paused' ? (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Progress</span>
            <span className="text-xs font-bold" style={{ color: 'var(--brand-primary)' }}>
              {job.progress || 0}%
            </span>
          </div>
          <div 
            className="h-3 w-full rounded-full overflow-hidden"
            style={{
              backgroundColor: '#F2F2F7',
              boxShadow: 'inset 2px 2px 4px #d1d1d6, inset -2px -2px 4px #ffffff'
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${job.progress || 0}%` }}
              transition={{ duration: 0.3 }}
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, var(--brand-primary), var(--status-info))',
                boxShadow: '0 2px 8px rgba(0, 122, 255, 0.4)'
              }}
            />
          </div>
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex gap-2">
        {job.status === 'watching' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPause(job.id)}
            data-testid={`pause-job-${job.id}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all"
            style={{
              backgroundColor: 'rgba(255, 204, 0, 0.15)',
              color: 'var(--status-warning)'
            }}
          >
            <Pause size={16} weight="fill" />
            Pause
          </motion.button>
        )}
        
        {job.status === 'paused' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onResume(job.id)}
            data-testid={`resume-job-${job.id}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all"
            style={{
              backgroundColor: 'rgba(0, 122, 255, 0.15)',
              color: 'var(--brand-primary)'
            }}
          >
            <Play size={16} weight="fill" />
            Resume
          </motion.button>
        )}
        
        {(job.status === 'watching' || job.status === 'paused' || job.status === 'queued') && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCancel(job.id)}
            data-testid={`cancel-job-${job.id}`}
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all"
            style={{
              backgroundColor: 'rgba(255, 59, 48, 0.15)',
              color: 'var(--status-danger)'
            }}
          >
            <X size={18} weight="bold" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default JobCard;
