
import { DeviceConfig, Route, Trip, MOSEvent } from '../types';

const LATENCY = 800;

export const mockApi = {
  registerDevice: async (config: DeviceConfig): Promise<{ saccoName: string }> => {
    await new Promise(r => setTimeout(r, LATENCY));
    if (config.saccoCode === 'ERR') throw new Error("Invalid SACCO Code");
    return { saccoName: `${config.saccoCode} TRANSIT` };
  },

  getRoutes: async (): Promise<Route[]> => {
    await new Promise(r => setTimeout(r, LATENCY));
    return [
      { id: 'r1', name: 'CBD - Westlands', standardFare: 50 },
      { id: 'r2', name: 'CBD - Ngong', standardFare: 100 },
      { id: 'r3', name: 'Town - Rongai', standardFare: 80 },
    ];
  },

  syncEvent: async (event: MOSEvent): Promise<boolean> => {
    await new Promise(r => setTimeout(r, LATENCY));
    // Simulate intermittent failure
    if (Math.random() < 0.1) throw new Error("Network timeout");
    console.log(`[API] Synced event: ${event.type}`, event.payload);
    return true;
  }
};
