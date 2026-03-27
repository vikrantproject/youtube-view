import { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const useStats = () => {
  const [stats, setStats] = useState({
    totalWatched: 0,
    totalFailed: 0,
    successRate: 0,
    activeJobs: 0,
    queuedJobs: 0,
    totalWatchTime: 0,
    averageWatchTime: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, refetch: fetchStats };
};

export default useStats;
