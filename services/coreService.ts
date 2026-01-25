import { CoreResponse, ConnectionStatus, Route, Trip, CrewMember, Vehicle, Seat } from '../types';
import { api } from './api';
import { db } from './databaseClient';

class CoreService {
  private failureCount = 0;
  private maxFailures = 3;
  private status: ConnectionStatus = 'CONNECTED';
  private statusListeners: Array<(status: ConnectionStatus) => void> = [];
  private eventListeners: Map<string, Array<(payload: any) => void>> = new Map();

  async fetchCore<T>(
    command: (apiInstance: typeof api) => Promise<CoreResponse<T>>,
    dbKey: string | null,
    fallback: T
  ): Promise<T> {
    if (this.status === 'DISCONNECTED') {
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
        { id: 'off-1', origin: 'Westlands', destination: 'Express', stops: [], standardFare: 50 },
        { id: 'off-2', origin: 'Rongai', destination: 'Direct', stops: [], standardFare: 100 }
      ]
    );
  }

  async getOperatorState(operatorId?: string) {
    return this.fetchCore(
      (api) => api.getState(operatorId),
      'terminal_state',
      { operator: null as any, activeTrip: null, vehicle: null }
    );
  }

  async getVehicleSeats(vehicleId: string): Promise<Seat[]> {
    return this.fetchCore(
      (api) => api.getVehicleSeats(vehicleId),
      `seats_${vehicleId}`,
      []
    );
  }

  // Event Bus
  on(eventName: string, callback: (payload: any) => void) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)!.push(callback);
    return () => {
      const listeners = this.eventListeners.get(eventName);
      if (listeners) {
        this.eventListeners.set(eventName, listeners.filter(l => l !== callback));
      }
    };
  }

  emit(eventName: string, payload: any) {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) listeners.forEach(l => l(payload));
    const wildcards = this.eventListeners.get('*');
    if (wildcards) wildcards.forEach(l => l({ eventName, payload }));
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