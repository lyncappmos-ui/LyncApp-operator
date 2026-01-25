export type AppState = 'SETUP' | 'HOME' | 'START_TRIP' | 'TICKETING' | 'OVERVIEW' | 'END_TRIP' | 'SEAT_MAP';

export type ConnectionStatus = 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED';

export type SeatStatus = 'AVAILABLE' | 'BOOKED' | 'RESERVED';

export interface CrewMember {
  id: string;
  name: string;
  role: 'driver' | 'conductor' | 'admin';
}

export interface Route {
  id: string;
  origin: string;
  destination: string;
  stops: string[];
  standardFare?: number; // Added for terminal UI
}

export interface Vehicle {
  id: string;
  registration: string;
  type: 'bus' | 'matatu' | 'minibus';
  seats: number;
}

export interface Trip {
  id: string;
  routeId: string;
  vehicleId: string;
  startTime: string;
  status: 'scheduled' | 'active' | 'completed';
  routeName?: string; // For UI convenience
}

export interface Booking {
  seatNumber: string;
  passengerName: string;
  tripId: string;
  status: 'booked' | 'available';
}

export interface Seat {
  seatNumber: string;
  booked: boolean;
}

export interface Ticket {
  id: string;
  tripId: string;
  seatNumber: string;
  passengerName: string;
  amountPaid: number;
  timestamp: string;
  synced: boolean;
}

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

export type EventType = 'TRIP_START' | 'TICKET_ISSUE' | 'TRIP_END' | 'SEAT_UPDATE';

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