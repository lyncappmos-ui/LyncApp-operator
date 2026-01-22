
import { MOSEvent, EventType } from '../types';
import { api } from './api';
import { unwrapCoreData } from './coreAdapter';

const STORAGE_KEY = 'lyncapp_event_queue';

export class EventQueue {
  private static events: MOSEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

  static addEvent(type: EventType, payload: any): MOSEvent {
    const event: MOSEvent = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: new Date().toISOString(),
      status: 'PENDING',
      retryCount: 0
    };
    this.events.push(event);
    this.save();
    return event;
  }

  static getPending(): MOSEvent[] {
    return this.events.filter(e => e.status === 'PENDING');
  }

  static async sync(onProgress?: (status: boolean) => void) {
    const pending = this.getPending();
    if (pending.length === 0) return;

    for (const event of pending) {
      try {
        const response = await api.syncEvent(event);
        const success = unwrapCoreData(response);
        if (success) {
          event.status = 'SYNCED';
        } else {
          throw new Error(response.error || "Sync rejected");
        }
      } catch (err) {
        console.error(`[Queue] Sync failed for ${event.id}:`, err);
        event.retryCount++;
        if (event.retryCount > 10) event.status = 'FAILED';
      }
      this.save();
      if (onProgress) onProgress(true);
    }
  }

  static getStats() {
    return {
      pending: this.getPending().length,
      total: this.events.length,
      synced: this.events.filter(e => e.status === 'SYNCED').length
    };
  }

  static clearSynced() {
    this.events = this.events.filter(e => e.status !== 'SYNCED');
    this.save();
  }

  private static save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events));
  }
}
