import { create } from 'zustand';

const useStatsStore = create((set) => ({
  stats: {
    totalWatched: 0,
    totalFailed: 0,
    successRate: 0,
    activeJobs: 0,
    queuedJobs: 0,
    totalWatchTime: 0,
    averageWatchTime: 0
  },
  
  setStats: (stats) => set({ stats }),
  
  updateStats: (updates) => set((state) => ({
    stats: { ...state.stats, ...updates }
  }))
}));

export default useStatsStore;
