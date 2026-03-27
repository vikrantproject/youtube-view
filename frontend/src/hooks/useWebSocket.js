import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const useWebSocket = (onJobUpdate) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
      newSocket.emit('subscribe', { room: 'jobs' });
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('job:created', (data) => {
      console.log('Job created:', data);
      if (onJobUpdate) onJobUpdate('created', data);
    });

    newSocket.on('job:started', (data) => {
      console.log('Job started:', data);
      if (onJobUpdate) onJobUpdate('started', data);
    });

    newSocket.on('job:progress', (data) => {
      if (onJobUpdate) onJobUpdate('progress', data);
    });

    newSocket.on('job:completed', (data) => {
      console.log('Job completed:', data);
      if (onJobUpdate) onJobUpdate('completed', data);
    });

    newSocket.on('job:failed', (data) => {
      console.log('Job failed:', data);
      if (onJobUpdate) onJobUpdate('failed', data);
    });

    newSocket.on('job:paused', (data) => {
      console.log('Job paused:', data);
      if (onJobUpdate) onJobUpdate('paused', data);
    });

    newSocket.on('job:resumed', (data) => {
      console.log('Job resumed:', data);
      if (onJobUpdate) onJobUpdate('resumed', data);
    });

    newSocket.on('job:cancelled', (data) => {
      console.log('Job cancelled:', data);
      if (onJobUpdate) onJobUpdate('cancelled', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [onJobUpdate]);

  return { socket, connected };
};

export default useWebSocket;
