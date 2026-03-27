import { motion } from 'framer-motion';
import { TrendUp, CheckCircle, Lightning, Clock } from '@phosphor-icons/react';

const StatsGrid = ({ stats }) => {
  const statCards = [
    {
      icon: <TrendUp size={32} weight="duotone" />,
      value: stats.totalWatched.toLocaleString(),
      label: 'Total Views',
      color: 'var(--brand-primary)',
      testId: 'stat-total-views'
    },
    {
      icon: <CheckCircle size={32} weight="duotone" />,
      value: `${stats.successRate}%`,
      label: 'Success Rate',
      color: 'var(--status-success)',
      testId: 'stat-success-rate'
    },
    {
      icon: <Lightning size={32} weight="duotone" />,
      value: `${stats.activeJobs}/10`,
      label: 'Active Sessions',
      color: 'var(--status-info)',
      testId: 'stat-active-sessions'
    },
    {
      icon: <Clock size={32} weight="duotone" />,
      value: formatTime(stats.totalWatchTime),
      label: 'Watch Time',
      color: 'var(--status-warning)',
      testId: 'stat-watch-time'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
    >
      {statCards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 + index * 0.05 }}
          whileHover={{ 
            scale: 1.02,
            boxShadow: '8px 8px 16px #d1d1d6, -8px -8px 16px #ffffff, 0 4px 12px rgba(0,122,255,0.1)'
          }}
          className="rounded-3xl p-6 sm:p-8 border border-white/50 transition-all duration-300"
          style={{
            backgroundColor: '#F2F2F7',
            boxShadow: '6px 6px 12px #d1d1d6, -6px -6px 12px #ffffff'
          }}
          data-testid={card.testId}
        >
          <div className="flex items-start justify-between mb-4">
            <div 
              className="p-3 rounded-2xl"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                color: card.color
              }}
            >
              {card.icon}
            </div>
          </div>
          
          <div>
            <div 
              className="text-3xl font-bold mb-1" 
              style={{ 
                fontFamily: "'Outfit', sans-serif",
                color: 'var(--text-primary)'
              }}
            >
              {card.value}
            </div>
            <div 
              className="text-sm uppercase tracking-wider" 
              style={{ color: 'var(--text-secondary)' }}
            >
              {card.label}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

export default StatsGrid;
