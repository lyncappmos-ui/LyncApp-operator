
import { CoreResponse, ConnectionStatus } from '../types';
import { api } from './api';

class CoreClient {
  private failureCount = 0;
  private maxFailures = 3;
  private status: ConnectionStatus = 'CONNECTED';
  private statusListeners: Array<(status: ConnectionStatus) => void> = [];

  /**
   * Centralized Fetch Utility for MOS Core.
   * action: The API command to execute.
   * fallback: Data to return if the core is unreachable.
   */
  async fetchCore<T>(
    command: (apiInstance: typeof api) => Promise<CoreResponse<T>>,
    fallback: T
  ): Promise<T> {
    try {
      const response = await command(api);
      
      if (response && response.ok && response.data !== null) {
        this.resetCircuit();
        return response.data;
      }
      
      throw new Error(response?.error || 'Core returned empty data');
    } catch (err) {
      this.recordFailure();
      console.warn(`[CoreClient] Falling back to local/cache for command. Reason:`, err);
      return fallback;
    }
  }

  private recordFailure() {
    this.failureCount++;
    if (this.failureCount >= this.maxFailures) {
      this.updateStatus('DISCONNECTED');
    } else if (this.failureCount > 0) {
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
    // Attempt a lightweight probe
    const res = await api.getCrew(['000']); 
    if (res.ok) {
      this.resetCircuit();
      return true;
    }
    this.updateStatus('DISCONNECTED');
    return false;
  }
}

export const coreClient = new CoreClient();
