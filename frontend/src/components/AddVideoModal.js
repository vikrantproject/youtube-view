import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, VideoCamera } from '@phosphor-icons/react';

const AddVideoModal = ({ isOpen, onClose, onSubmit }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [priority, setPriority] = useState(5);
  const [duration, setDuration] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!videoUrl.includes('youtube.com/watch?v=')) {
      alert('Please enter a valid YouTube video URL');
      return;
    }

    onSubmit({
      videoUrl,
      priority: parseInt(priority),
      duration: duration ? parseInt(duration) : null
    });

    // Reset form
    setVideoUrl('');
    setPriority(5);
    setDuration('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)'
            }}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-3xl p-8 border border-white/40"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
              }}
              data-testid="add-video-modal"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-3 rounded-2xl"
                    style={{
                      backgroundColor: 'rgba(0, 122, 255, 0.15)',
                      color: 'var(--brand-primary)'
                    }}
                  >
                    <VideoCamera size={24} weight="duotone" />
                  </div>
                  <h2 
                    className="text-2xl font-semibold" 
                    style={{ 
                      fontFamily: "'Outfit', sans-serif",
                      color: 'var(--text-primary)'
                    }}
                  >
                    Add Video
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl transition-all hover:bg-black/5"
                  data-testid="close-modal-button"
                >
                  <X size={24} style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Video URL */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    YouTube Video URL
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                    data-testid="video-url-input"
                    className="w-full px-4 py-3 rounded-2xl border-none focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: '#F2F2F7',
                      boxShadow: 'inset 4px 4px 8px #d1d1d6, inset -4px -4px 8px #ffffff',
                      color: 'var(--text-primary)',
                      focusRingColor: 'var(--brand-primary)'
                    }}
                  />
                </div>

                {/* Priority */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Priority (0-10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    data-testid="priority-input"
                    className="w-full px-4 py-3 rounded-2xl border-none focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: '#F2F2F7',
                      boxShadow: 'inset 4px 4px 8px #d1d1d6, inset -4px -4px 8px #ffffff',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                {/* Duration (optional) */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Watch Duration (seconds, optional)
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Leave empty for full video"
                    data-testid="duration-input"
                    className="w-full px-4 py-3 rounded-2xl border-none focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: '#F2F2F7',
                      boxShadow: 'inset 4px 4px 8px #d1d1d6, inset -4px -4px 8px #ffffff',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  data-testid="submit-video-button"
                  className="w-full py-3 rounded-2xl font-semibold text-white transition-all"
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    boxShadow: '0 8px 16px rgba(0, 122, 255, 0.3)'
                  }}
                >
                  Add to Queue
                </motion.button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddVideoModal;
