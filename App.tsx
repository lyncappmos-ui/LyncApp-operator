import React, { useState, useEffect, useCallback } from 'react';
import { AppState, DeviceConfig, Trip, SyncStatus, Route } from './types';
import { EventQueue } from './services/eventQueue';
import { coreClient } from './services/coreClient';
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

const App: React.FC = () => {
  const [device, setDevice] = useState<DeviceConfig | null>(() => {
    const saved = localStorage.getItem('mos_device');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AppState>(device ? 'HOME' : 'SETUP');
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState({
    pendingCount: 0,
    isSyncing: false
  });

  // Verify Environment
  useEffect(() => {
    // If we use environment variables, validate them here. 
    // For this context, we assume the environment is handled by the Bridge.
  }, []);

  // Hybrid Handshake and Context Recovery
  useEffect(() => {
    const performHandshake = async () => {
      try {
        if (device) {
          const context = await coreClient.fetchCore(
            (api) => api.getTerminalContext(device.operatorPhone),
            'terminal_context',
            { activeTrip: null }
          );
          
          let tripToSet = context?.activeTrip;
          if (!tripToSet) tripToSet = await db.getActiveTrip();

          if (tripToSet) {
            setActiveTrip(tripToSet);
            setCurrentScreen('TICKETING');
          }
        }
      } catch (err: any) {
        console.warn('[App] Recovery failed, proceeding in safety mode.', err);
      } finally {
        setIsInitializing(false);
      }
    };

    performHandshake();
  }, [device]);

  const triggerSync = useCallback(async () => {
    if (coreClient.getStatus() === 'DISCONNECTED') return;
    
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
    }, 10000); // 10s sync window

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
      routeName: route.name,
      startTime: new Date().toISOString(),
      vehicleReg: device.vehicleReg,
      status: 'ACTIVE'
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

  const renderScreen = () => {
    if (isInitializing) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-pulse">
          <i className="fa-solid fa-microchip text-5xl mb-6 text-[#1A365D]"></i>
          <h2 className="text-xl font-black text-gray-800 mb-2 tracking-tight">Booting Terminal...</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-teal-600">Secure MOS Link</p>
        </div>
      );
    }

    if (initError) {
       return (
         <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-rose-50 rounded-3xl border-2 border-rose-100">
           <i className="fa-solid fa-circle-xmark text-5xl mb-4 text-rose-500"></i>
           <h2 className="text-xl font-black text-rose-700 mb-2">Init Error</h2>
           <p className="text-xs text-rose-600 mb-6">{initError}</p>
           <button onClick={() => window.location.reload()} className="bg-rose-600 text-white px-8 py-3 rounded-xl font-bold uppercase text-xs">Reload</button>
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
      case 'TICKETING': return <TicketScreen trip={activeTrip!} onOverview={() => setCurrentScreen('OVERVIEW')} />;
      case 'OVERVIEW': return <TripOverviewScreen trip={activeTrip!} onEndTrip={() => setCurrentScreen('END_TRIP')} onBack={() => setCurrentScreen('TICKETING')} />;
      case 'END_TRIP': return <EndTripScreen trip={activeTrip!} onConfirm={handleEndTrip} onCancel={() => setCurrentScreen('OVERVIEW')} />;
      default: return <div>Unknown Interface State</div>;
    }
  };

  const screenTitles: Record<AppState, string> = {
    'SETUP': 'Activation',
    'HOME': device?.saccoName || 'Operator Deck',
    'START_TRIP': 'Fleets',
    'TICKETING': 'Revenue Registry',
    'OVERVIEW': 'Trip Metrics',
    'END_TRIP': 'Close Session'
  };

  return (
    <ErrorBoundary>
      <AppShell
        title={screenTitles[currentScreen]}
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