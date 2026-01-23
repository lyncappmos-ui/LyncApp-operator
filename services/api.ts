import { DeviceConfig, Route, MOSEvent, Trip, CoreResponse } from '../types';
import { wrapAsCoreResponse } from './coreAdapter';

// Safe access to environment or bridge origin
const CORE_ORIGIN = 'https://core.lync.app';
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
    if (event.origin !== CORE_ORIGIN && !event.origin.includes('lync.app')) return;
    
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
      console.warn(`[Bridge] Hub unreachable. Falling back to internal simulation logic.`);
      const simulatedData = await this.simulate(command, payload);
      return wrapAsCoreResponse(simulatedData as T);
    }

    return new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        this.pendingRequests.delete(requestId);
        resolve(wrapAsCoreResponse(null, `CORE_TIMEOUT: Hub did not respond to ${command}`));
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
    await new Promise(r => setTimeout(r, 800));
    switch (command) {
      case 'getCrew': 
        return { name: 'Verified User', phone: payload[0] };
      case 'registerDevice': 
        return { saccoName: `${payload.saccoCode || 'LYNC'} TRANSIT` };
      case 'getRoutes': 
        return [
          { id: 'r1', name: 'CBD - Westlands (Local)', standardFare: 50 },
          { id: 'r2', name: 'CBD - Ngong (Local)', standardFare: 100 },
          { id: 'r3', name: 'Town - Rongai (Local)', standardFare: 80 },
        ];
      case 'getTerminalContext':
        return { activeTrip: null };
      case 'ticket':
        return { success: true };
      case 'syncEvent': 
        return true;
      default: 
        return null;
    }
  }

  async getCrew(phoneNumbers: string[]): Promise<CoreResponse<any>> {
    return this.request('getCrew', phoneNumbers);
  }

  async registerDevice(config: DeviceConfig): Promise<CoreResponse<{ saccoName: string }>> {
    return this.request('registerDevice', config);
  }

  async getRoutes(): Promise<CoreResponse<Route[]>> {
    return this.request('getRoutes');
  }

  async getTerminalContext(phone: string): Promise<CoreResponse<{ activeTrip: Trip | null }>> {
    return this.request('getTerminalContext', phone);
  }

  async ticket(tripId: string, phone: string, amount: number): Promise<CoreResponse<any>> {
    return this.request('ticket', { tripId, phone, amount });
  }

  async syncEvent(event: MOSEvent): Promise<CoreResponse<boolean>> {
    return this.request('syncEvent', event);
  }
}

export const api = new MOSCoreBridge();