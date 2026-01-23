import { useState, useEffect } from 'react';
import { ConnectionStatus } from '../types';
import { coreService } from '../services/coreService';

export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [status, setStatus] = useState<ConnectionStatus>(coreService.getStatus());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = coreService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  return { 
    isOnline, 
    status, 
    isDegraded: status === 'DEGRADED', 
    isDisconnected: status === 'DISCONNECTED' || !isOnline 
  };
}