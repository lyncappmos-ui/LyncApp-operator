
export type AppState = 'SETUP' | 'HOME' | 'START_TRIP' | 'TICKETING' | 'OVERVIEW' | 'END_TRIP';

export type ConnectionStatus = 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED';

export interface CoreResponse<T> {
  ok: boolean;
  data: T | null;
  error?: string;
  timestamp: string;
}

export interface DeviceConfig {
  saccoCode: string;
  branch: string;
  vehicleReg: string;
  operatorPin: string;
  operatorPhone: string;
  saccoName?: string;
}

export interface Route {
  id: string;
  name: string;
  standardFare: number;
}

export interface Trip {
  id: string;
  routeId: string;
  routeName: string;
  startTime: string;
  vehicleReg: string;
  status: 'ACTIVE' | 'COMPLETED';
}

export interface Ticket {
  id: string;
  tripId: string;
  amount: number;
  timestamp: string;
  passengerPhone?: string;
  paymentType: 'CASH' | 'MOBILE';
  synced: boolean;
}

export type EventType = 'TRIP_START' | 'TICKET_ISSUE' | 'TRIP_END';

export interface MOSEvent {
  id: string;
  type: EventType;
  payload: any;
  timestamp: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  retryCount: number;
}

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  connectionState: ConnectionStatus;
}
