
import { CoreResponse, ConnectionStatus } from '../types';
import { api } from './api';
import { db } from './databaseClient';

class CoreClient {
  private failureCount = 0;
  private maxFailures = 3;
  private status: ConnectionStatus = 'CONNECTED';
  private statusListeners: Array<(status: ConnectionStatus) => void> = [];

  /**
   * Centralized Fetch Utility for MOS Core with Hybrid Fallback.
   * 1. Attempts RPC via Core Bridge.
   * 2. If failure/timeout, attempts DB/Cache lookup.
   * 3. If all fail, returns hardcoded fallback.
   */
  async fetchCore<T>(
    command: (apiInstance: typeof api) => Promise<CoreResponse<T>>,
    dbKey: string | null,
    fallback: T
  ): Promise<T> {
    // 1. Try Live RPC
    try {
      const response = await command(api);
      
      if (response && response.ok && response.data !== null) {
        this.resetCircuit();
        // Update DB Cache asynchronously
        if (dbKey) db.set(dbKey, response.data);
        return response.data;
      }
      throw new Error(response?.error || 'Core returned empty/error');
    } catch (err) {
      this.recordFailure();
      console.warn(`[CoreClient] RPC Failed. Checking DB Fallback for: ${dbKey}`);
      
      // 2. Try DB Fallback
      if (dbKey) {
        const cachedData = await db.get<T>(dbKey);
        if (cachedData !== null) {
          console.info(`[CoreClient] Serving cached data for: ${dbKey}`);
          return cachedData;
        }
      }
      
      // 3. Last Resort: Hardcoded Fallback
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

export const coreClient = new CoreClient();
