import { useState, useEffect } from 'react';
import { ConnectionStatus } from '../types';
import { coreClient } from '../services/coreClient';

export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [status, setStatus] = useState<ConnectionStatus>(coreClient.getStatus());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = coreClient.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  return { isOnline, status, isDegraded: status === 'DEGRADED', isDisconnected: status === 'DISCONNECTED' };
}