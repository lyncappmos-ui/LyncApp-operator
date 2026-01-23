import { CoreResponse, ConnectionStatus, Route } from '../types';
import { api } from './api';
import { db } from './databaseClient';

class CoreService {
  private failureCount = 0;
  private maxFailures = 3;
  private status: ConnectionStatus = 'CONNECTED';
  private statusListeners: Array<(status: ConnectionStatus) => void> = [];

  /**
   * Safe Data Fetching with Circuit Breaker and Local Fallback
   */
  async fetchCore<T>(
    command: (apiInstance: typeof api) => Promise<CoreResponse<T>>,
    dbKey: string | null,
    fallback: T
  ): Promise<T> {
    if (this.status === 'DISCONNECTED') {
      console.warn(`[CoreService] Circuit open. Using local data for: ${dbKey}`);
      if (dbKey) {
        const cached = await db.get<T>(dbKey);
        if (cached !== null) return cached;
      }
      return fallback;
    }

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
      console.error(`[CoreService] RPC Fault. Attempting local recovery for: ${dbKey}`);
      
      if (dbKey) {
        const cachedData = await db.get<T>(dbKey);
        if (cachedData !== null) return cachedData;
      }
      
      return fallback;
    }
  }

  // Domain Specific Wrappers
  async fetchRoutes(): Promise<Route[]> {
    return this.fetchCore(
      (api) => api.getRoutes(),
      'routes',
      [
        { id: 'off-1', name: 'Westlands Express (Offline)', standardFare: 50 },
        { id: 'off-2', name: 'Rongai Direct (Offline)', standardFare: 100 }
      ]
    );
  }

  async fetchTerminalContext(phone: string) {
    return this.fetchCore(
      (api) => api.getTerminalContext(phone),
      'terminal_context',
      { activeTrip: null }
    );
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
      // Small health check probe
      const res = await api.getRoutes();
      if (res.ok) {
        this.resetCircuit();
        return true;
      }
    } catch {}
    this.updateStatus('DISCONNECTED');
    return false;
  }
}

export const coreService = new CoreService();