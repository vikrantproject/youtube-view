import { motion, AnimatePresence } from 'framer-motion';
import { Warning, X } from '@phosphor-icons/react';

const DisclaimerModal = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)'
            }}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-3xl p-8 sm:p-12 border border-white/40"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
              }}
              data-testid="disclaimer-modal"
            >
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div 
                  className="p-4 rounded-3xl"
                  style={{
                    backgroundColor: 'rgba(255, 204, 0, 0.15)',
                    color: 'var(--status-warning)'
                  }}
                >
                  <Warning size={48} weight="duotone" />
                </div>
              </div>

              {/* Title */}
              <h2 
                className="text-3xl font-bold text-center mb-6" 
                style={{ 
                  fontFamily: "'Outfit', sans-serif",
                  color: 'var(--text-primary)'
                }}
              >
                Educational Use Only
              </h2>

              {/* Content */}
              <div 
                className="space-y-4 mb-8 text-base leading-relaxed"
                style={{ color: 'var(--text-primary)' }}
              >
                <p>
                  This <strong>YouTube View Automation System</strong> is provided strictly for{' '}
                  <strong>educational and research purposes</strong>.
                </p>

                <div 
                  className="p-4 rounded-2xl"
                  style={{ backgroundColor: 'rgba(255, 59, 48, 0.1)' }}
                >
                  <p className="font-semibold mb-2" style={{ color: 'var(--status-danger)' }}>
                    ⚠️ Important Notice:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Users are solely responsible for compliance with YouTube's Terms of Service</li>
                    <li>Using this tool may violate platform policies and result in account suspension</li>
                    <li>The developers assume no liability for misuse of this software</li>
                    <li>This software is provided "as is" without warranty of any kind</li>
                  </ul>
                </div>

                <p>
                  By using this tool, you acknowledge that you understand these restrictions and{' '}
                  agree to use it responsibly and legally.
                </p>
              </div>

              {/* Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                data-testid="accept-disclaimer-button"
                className="w-full py-4 rounded-2xl font-semibold text-white transition-all"
                style={{
                  backgroundColor: 'var(--brand-primary)',
                  boxShadow: '0 8px 16px rgba(0, 122, 255, 0.3)'
                }}
              >
                I Understand & Accept
              </motion.button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DisclaimerModal;
