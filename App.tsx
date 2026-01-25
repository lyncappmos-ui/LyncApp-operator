import React, { useState, useEffect, useCallback } from 'react';
import { AppState, DeviceConfig, Trip, Route, Ticket, CrewMember, Vehicle } from './types';
import { EventQueue } from './services/eventQueue';
import { coreService } from './services/coreService';
import { db } from './services/databaseClient';

// Components
import AppShell from './components/AppShell';
import ErrorBoundary from './components/ErrorBoundary';

// Screens
import SetupScreen from './screens/SetupScreen';
import HomeScreen from './screens/HomeScreen';
import StartTripScreen from './screens/StartTripScreen';
import TicketScreen from './screens/TicketScreen';
import TripOverviewScreen from './screens/TripOverviewScreen';
import EndTripScreen from './screens/EndTripScreen';
import SeatMapScreen from './screens/SeatMapScreen';

const App: React.FC = () => {
  const [device, setDevice] = useState<DeviceConfig | null>(() => {
    const saved = localStorage.getItem('mos_device');
    return saved ? JSON.parse(saved) : null;
  });

  const [operator, setOperator] = useState<CrewMember | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AppState>(device ? 'HOME' : 'SETUP');
  const [isInitializing, setIsInitializing] = useState(true);
  const [pendingTicket, setPendingTicket] = useState<{ amount: number; phone?: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState({
    pendingCount: 0,
    isSyncing: false
  });

  // Handshake with MOS Core State API
  useEffect(() => {
    const syncState = async () => {
      try {
        if (device) {
          const state = await coreService.getOperatorState(device.operatorPhone);
          setOperator(state.operator);
          
          let tripToSet = state.activeTrip;
          if (!tripToSet) tripToSet = await db.getActiveTrip();

          if (tripToSet) {
            setActiveTrip(tripToSet);
            if (currentScreen === 'HOME') setCurrentScreen('TICKETING');
          }
        }
      } catch (err) {
        console.warn('[App] RPC state sync failed', err);
      } finally {
        setIsInitializing(false);
      }
    };

    syncState();
  }, [device]);

  const triggerSync = useCallback(async () => {
    if (coreService.getStatus() === 'DISCONNECTED') return;
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      await EventQueue.sync();
    } finally {
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        pendingCount: EventQueue.getPending().length
      }));
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(prev => ({
        ...prev,
        pendingCount: EventQueue.getPending().length
      }));
      triggerSync();
    }, 15000); 
    return () => clearInterval(interval);
  }, [triggerSync]);

  const handleSetupComplete = (config: DeviceConfig) => {
    setDevice(config);
    localStorage.setItem('mos_device', JSON.stringify(config));
    setCurrentScreen('HOME');
  };

  const handleStartTrip = async (route: Route) => {
    if (!device) return;
    const newTrip: Trip = {
      id: crypto.randomUUID(),
      routeId: route.id,
      vehicleId: device.vehicleReg,
      startTime: new Date().toISOString(),
      status: 'active',
      routeName: `${route.origin} → ${route.destination}`
    };
    setActiveTrip(newTrip);
    await db.saveActiveTrip(newTrip);
    EventQueue.addEvent('TRIP_START', newTrip);
    setCurrentScreen('TICKETING');
    triggerSync();
  };

  const handleEndTrip = async () => {
    if (activeTrip) {
      EventQueue.addEvent('TRIP_END', { tripId: activeTrip.id, endTime: new Date().toISOString() });
    }
    setActiveTrip(null);
    await db.saveActiveTrip(null);
    setCurrentScreen('HOME');
    triggerSync();
  };

  const initiateTicketBooking = (amount: number, phone?: string) => {
    setPendingTicket({ amount, phone });
    setCurrentScreen('SEAT_MAP');
  };

  const handleFinalizeTicket = async (seatNumber: string) => {
    if (!activeTrip || !pendingTicket) return;

    const ticket: Ticket = {
      id: crypto.randomUUID(),
      tripId: activeTrip.id,
      seatNumber,
      passengerName: pendingTicket.phone || 'Anonymous',
      amountPaid: pendingTicket.amount,
      timestamp: new Date().toISOString(),
      synced: false
    };

    EventQueue.addEvent('TICKET_ISSUE', ticket);
    coreService.emit('seatBooked', { tripId: activeTrip.id, seatNumber });

    setPendingTicket(null);
    setCurrentScreen('TICKETING');
    triggerSync();
  };

  const renderScreen = () => {
    if (isInitializing) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white rounded-[2rem] shadow-inner">
          <div className="w-16 h-16 bg-[#1A365D] rounded-3xl flex items-center justify-center mb-6 animate-bounce shadow-2xl">
             <i className="fa-solid fa-microchip text-teal-400 text-2xl"></i>
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-2 tracking-tight">Syncing Terminal</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-teal-600 animate-pulse">Lync Core Handshake</p>
        </div>
      );
    }

    switch (currentScreen) {
      case 'SETUP': return <SetupScreen onComplete={handleSetupComplete} />;
      case 'HOME': return (
        <HomeScreen
          device={device!}
          activeTrip={activeTrip}
          onStartTrip={() => setCurrentScreen('START_TRIP')}
          onResumeTrip={() => setCurrentScreen('TICKETING')}
        />
      );
      case 'START_TRIP': return <StartTripScreen onStart={handleStartTrip} onBack={() => setCurrentScreen('HOME')} />;
      case 'TICKETING': return (
        <TicketScreen 
          trip={activeTrip!} 
          onOverview={() => setCurrentScreen('OVERVIEW')} 
          onSeatMap={() => { setPendingTicket(null); setCurrentScreen('SEAT_MAP'); }}
          onIssueTicket={initiateTicketBooking}
        />
      );
      case 'SEAT_MAP': return (
        <SeatMapScreen 
          trip={activeTrip!} 
          selectionMode={!!pendingTicket}
          onBack={() => { setPendingTicket(null); setCurrentScreen('TICKETING'); }} 
          onConfirmSelection={handleFinalizeTicket}
        />
      );
      case 'OVERVIEW': return <TripOverviewScreen trip={activeTrip!} onEndTrip={() => setCurrentScreen('END_TRIP')} onBack={() => setCurrentScreen('TICKETING')} />;
      case 'END_TRIP': return <EndTripScreen trip={activeTrip!} onConfirm={handleEndTrip} onCancel={() => setCurrentScreen('OVERVIEW')} />;
      default: return <div>Interface State Unknown</div>;
    }
  };

  return (
    <ErrorBoundary>
      <AppShell
        title={operator ? `${operator.name} (${operator.role})` : (device?.saccoName || 'Operator Deck')}
        pendingCount={syncStatus.pendingCount}
        isSyncing={syncStatus.isSyncing}
        onBack={currentScreen !== 'HOME' && currentScreen !== 'SETUP' && currentScreen !== 'TICKETING' ? () => setCurrentScreen('HOME') : undefined}
      >
        {renderScreen()}
      </AppShell>
    </ErrorBoundary>
  );
};

export default App;