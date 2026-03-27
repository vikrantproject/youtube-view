import { motion, AnimatePresence } from 'framer-motion';
import { Info, CheckCircle, Warning, XCircle } from '@phosphor-icons/react';

const ActivityFeed = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} weight="fill" style={{ color: 'var(--status-success)' }} />;
      case 'error':
        return <XCircle size={16} weight="fill" style={{ color: 'var(--status-danger)' }} />;
      case 'warning':
        return <Warning size={16} weight="fill" style={{ color: 'var(--status-warning)' }} />;
      default:
        return <Info size={16} weight="fill" style={{ color: 'var(--status-info)' }} />;
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h2 
        className="text-2xl md:text-3xl font-medium mb-6" 
        style={{ 
          fontFamily: "'Outfit', sans-serif",
          color: 'var(--text-primary)'
        }}
      >
        Activity Feed
      </h2>
      
      <div 
        className="rounded-3xl p-6 sm:p-8 border border-white/40"
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          maxHeight: '400px',
          overflowY: 'auto'
        }}
        data-testid="activity-feed"
      >
        {activities.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
            No activities yet
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {activities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-start gap-3 p-3 rounded-2xl"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
                >
                  <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {activity.message}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      {activity.timestamp}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.section>
  );
};

export default ActivityFeed;
