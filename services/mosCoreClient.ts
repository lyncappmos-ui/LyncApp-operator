import { CoreResponse, ConnectionStatus } from '../types';
import { api } from './api';
import { db } from './databaseClient';

class MOSCoreClient {
  private failureCount = 0;
  private maxFailures = 3;
  private status: ConnectionStatus = 'CONNECTED';
  private statusListeners: Array<(status: ConnectionStatus) => void> = [];

  /**
   * Centralized Fetch Utility for MOS Core with Hybrid Fallback.
   */
  async fetchCore<T>(
    command: (apiInstance: typeof api) => Promise<CoreResponse<T>>,
    dbKey: string | null,
    fallback: T
  ): Promise<T> {
    try {
      const response = await command(api);
      
      if (response && response.ok && response.data !== null) {
        this.resetCircuit();
        if (dbKey) db.set(dbKey, response.data);
        return response.data;
      }
      throw new Error(response?.error || 'Core returned empty/error');
    } catch (err) {
      this.recordFailure();
      console.warn(`[MOSCoreClient] RPC Failed. Checking DB Fallback for: ${dbKey}`);
      
      if (dbKey) {
        const cachedData = await db.get<T>(dbKey);
        if (cachedData !== null) return cachedData;
      }
      
      return fallback;
    }
  }

  private recordFailure() {
    this.failureCount++;
    if (this.failureCount >= this.maxFailures) {
      this.updateStatus('DISCONNECTED');
    } else {
      this.updateStatus('DEGRADED');
    }
  }

  private resetCircuit() {
    this.failureCount = 0;
    this.updateStatus('CONNECTED');
  }

  private updateStatus(newStatus: ConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach(listener => listener(newStatus));
    }
  }

  onStatusChange(listener: (status: ConnectionStatus) => void) {
    this.statusListeners.push(listener);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  getStatus() {
    return this.status;
  }

  async retryConnection() {
    this.updateStatus('DEGRADED');
    try {
      const res = await api.getCrew(['254000000000']); 
      if (res.ok) {
        this.resetCircuit();
        return true;
      }
    } catch {}
    this.updateStatus('DISCONNECTED');
    return false;
  }
}

export const mosCoreClient = new MOSCoreClient();