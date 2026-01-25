import { DeviceConfig, Route, MOSEvent, Trip, CoreResponse, CrewMember, Vehicle, Booking, Seat, Ticket } from '../types';
import { wrapAsCoreResponse } from './coreAdapter';

const getBaseUrl = () => {
  try {
    return (import.meta as any).env?.VITE_MOS_API_BASE_URL || 'https://lyncapp-mos-core.vercel.app/api';
  } catch {
    return 'https://lyncapp-mos-core.vercel.app/api';
  }
};

const BASE_URL = getBaseUrl();
const TIMEOUT = 12000;

class MOSCoreBridge {
  private iframe: HTMLIFrameElement | null = null;
  private pendingRequests = new Map<string, { resolve: Function, reject: Function, timer: number }>();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handleMessage.bind(this));
    }
  }

  private getIframe() {
    if (!this.iframe) {
      this.iframe = document.getElementById('mos-bridge') as HTMLIFrameElement;
    }
    return this.iframe;
  }

  private handleMessage(event: MessageEvent) {
    if (!event.origin.includes('lync.app') && !BASE_URL.includes(event.origin)) return;
    
    const { requestId, payload, error } = event.data;
    const request = this.pendingRequests.get(requestId);

    if (request) {
      window.clearTimeout(request.timer);
      this.pendingRequests.delete(requestId);
      if (error) request.reject(new Error(error));
      else request.resolve(payload);
    }
  }

  private async request<T>(command: string, payload: any = {}): Promise<CoreResponse<T>> {
    const iframe = this.getIframe();
    const requestId = crypto.randomUUID();

    if (!iframe || !iframe.contentWindow) {
      const simulatedData = await this.simulate(command, payload);
      return wrapAsCoreResponse(simulatedData as T);
    }

    return new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        this.pendingRequests.delete(requestId);
        resolve(wrapAsCoreResponse(null, `CORE_TIMEOUT: ${command}`));
      }, TIMEOUT);

      this.pendingRequests.set(requestId, { 
        resolve: (data: T) => resolve(wrapAsCoreResponse(data)), 
        reject: (err: Error) => resolve(wrapAsCoreResponse(null, err.message)), 
        timer 
      });

      try {
        iframe.contentWindow!.postMessage({ 
          type: `MOS_COMMAND:${command}`, 
          payload, 
          requestId 
        }, '*');
      } catch (err: any) {
        window.clearTimeout(timer);
        this.pendingRequests.delete(requestId);
        resolve(wrapAsCoreResponse(null, `BRIDGE_FAULT: ${err.message}`));
      }
    });
  }

  private async simulate(command: string, payload: any) {
    await new Promise(r => setTimeout(r, 600));
    switch (command) {
      case 'getState': 
        return { 
          operator: { id: 'op-1', name: 'Verified Operator', role: 'conductor' },
          activeTrip: null,
          vehicle: { id: 'v-1', registration: 'KDA 001X', type: 'matatu', seats: 14 }
        };
      case 'registerDevice': return { saccoName: `${payload.saccoCode || 'LYNC'} TRANSIT` };
      case 'getRoutes': return [
        { id: 'r1', origin: 'CBD', destination: 'Westlands', stops: [], standardFare: 50 },
        { id: 'r2', origin: 'CBD', destination: 'Ngong', stops: [], standardFare: 100 },
        { id: 'r3', origin: 'Town', destination: 'Rongai', stops: [], standardFare: 80 },
      ];
      case 'getVehicleSeats': 
        return Array.from({ length: payload.seats || 14 }, (_, i) => ({
          seatNumber: `${Math.floor(i/3)+1}${['A','B','C'][i%3]}`,
          booked: Math.random() < 0.3
        }));
      case 'getBookings': return [];
      case 'ticket': return { id: crypto.randomUUID(), ...payload, timestamp: new Date().toISOString() };
      case 'sendSms': return { success: true };
      case 'syncEvent': return true;
      // Fix: Added simulation logic for getCrew command
      case 'getCrew':
        return (payload.phones || []).map((phone: string) => ({
          id: `crew-${phone}`,
          name: 'Verified Crew Member',
          role: 'conductor'
        }));
      default: return null;
    }
  }

  async getState(operatorId?: string): Promise<CoreResponse<{ operator: CrewMember; activeTrip?: Trip; vehicle?: Vehicle }>> {
    return this.request('getState', { operatorId });
  }

  // Fix: Added missing getCrew method to MOSCoreBridge
  async getCrew(phones: string[]): Promise<CoreResponse<CrewMember[]>> {
    return this.request('getCrew', { phones });
  }

  async sendSms(phone: string, message: string): Promise<CoreResponse<{ success: boolean }>> {
    return this.request('sendSms', { phone, message });
  }

  async registerDevice(config: DeviceConfig): Promise<CoreResponse<{ saccoName: string }>> {
    return this.request('registerDevice', config);
  }

  async getRoutes(): Promise<CoreResponse<Route[]>> {
    return this.request('getRoutes');
  }

  async getVehicleSeats(vehicleId: string): Promise<CoreResponse<Seat[]>> {
    return this.request('getVehicleSeats', { vehicleId });
  }

  async getBookings(tripId: string): Promise<CoreResponse<Booking[]>> {
    return this.request('getBookings', { tripId });
  }

  async issueTicket(tripId: string, phone: string, amount: number, seatNumber: string): Promise<CoreResponse<Ticket>> {
    return this.request('ticket', { tripId, phone, amount, seatNumber });
  }

  async syncEvent(event: MOSEvent): Promise<CoreResponse<boolean>> {
    return this.request('syncEvent', event);
  }
}

export const api = new MOSCoreBridge();
