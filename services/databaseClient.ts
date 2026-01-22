
import { Route, Trip, MOSEvent } from '../types';

/**
 * databaseClient: Handles persistent storage for offline fallback.
 * In a production environment, this would interface with Supabase 
 * using VITE_CORE_DB_URL or REACT_APP_CORE_DB_URL.
 */
class DatabaseClient {
  private prefix = 'lync_db_';

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = localStorage.getItem(this.prefix + key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, data: T): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(data));
    } catch (e) {
      console.error("[DB] Cache write failed", e);
    }
  }

  // Domain specific helpers
  async getCachedRoutes(): Promise<Route[]> {
    return await this.get<Route[]>('routes') || [];
  }

  async saveRoutes(routes: Route[]) {
    await this.set('routes', routes);
  }

  async getActiveTrip(): Promise<Trip | null> {
    return await this.get<Trip>('active_trip');
  }

  async saveActiveTrip(trip: Trip | null) {
    await this.set('active_trip', trip);
  }
}

export const db = new DatabaseClient();
