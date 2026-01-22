
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, DeviceConfig, Trip, SyncStatus, Route, ConnectionStatus } from './types';
import { EventQueue } from './services/eventQueue';
import { coreClient } from './services/coreClient';
import Layout from './components/Layout';

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

  const [activeTrip, setActiveTrip] = useState<Trip | null>(() => {
    const saved = localStorage.getItem('mos_active_trip');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentScreen, setCurrentScreen] = useState<AppState>(device ? 'HOME' : 'SETUP');
  const [isInitializing, setIsInitializing] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    pendingCount: 0,
    isSyncing: false,
    connectionState: coreClient.getStatus()
  });

  // Listen for Core Status changes
  useEffect(() => {
    const unsubscribe = coreClient.onStatusChange((status) => {
      setSyncStatus(prev => ({ ...prev, connectionState: status }));
    });
    return unsubscribe;
  }, []);

  // Handshake and Context Recovery on initialization
  useEffect(() => {
    const performHandshake = async () => {
      try {
        if (device) {
          console.log('[App] Performing recovery with Core...');
          const context = await coreClient.fetchCore(
            (api) => api.getTerminalContext(device.operatorPhone),
            { activeTrip: null }
          );
          
          if (context?.activeTrip) {
            console.log('[App] Session recovered from Core');
            setActiveTrip(context.activeTrip);
            localStorage.setItem('mos_active_trip', JSON.stringify(context.activeTrip));
            setCurrentScreen('TICKETING');
          }
        }
      } catch (err) {
        console.warn('[App] Recovery failed. Using local storage state.');
      } finally {
        setIsInitializing(false);
      }
    };

    performHandshake();
  }, [device]);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || coreClient.getStatus() === 'DISCONNECTED') return;
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
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      setSyncStatus(prev => ({
        ...prev,
        pendingCount: EventQueue.getPending().length
      }));
      triggerSync();
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [triggerSync]);

  const handleSetupComplete = (config: DeviceConfig) => {
    setDevice(config);
    localStorage.setItem('mos_device', JSON.stringify(config));
    setCurrentScreen('HOME');
  };

  const handleStartTrip = (route: Route) => {
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
    localStorage.setItem('mos_active_trip', JSON.stringify(newTrip));
    EventQueue.addEvent('TRIP_START', newTrip);
    setCurrentScreen('TICKETING');
    triggerSync();
  };

  const handleEndTrip = () => {
    if (activeTrip) {
      EventQueue.addEvent('TRIP_END', { tripId: activeTrip.id, endTime: new Date().toISOString() });
    }
    setActiveTrip(null);
    localStorage.removeItem('mos_active_trip');
    setCurrentScreen('HOME');
    triggerSync();
  };

  const renderScreen = () => {
    if (isInitializing) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
          <i className="fa-solid fa-satellite-dish fa-bounce text-5xl mb-6 text-[#1A365D]"></i>
          <h2 className="text-xl font-bold text-gray-700 mb-2">Syncing Terminal...</h2>
          <p className="text-xs">Connecting to MOS Core Hub</p>
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
      default: return <div>Unknown Screen</div>;
    }
  };

  const screenTitles: Record<AppState, string> = {
    'SETUP': 'Device Activation',
    'HOME': device?.saccoName || 'Operator Terminal',
    'START_TRIP': 'New Session',
    'TICKETING': 'Revenue Deck',
    'OVERVIEW': 'Trip Data',
    'END_TRIP': 'Close Session'
  };

  return (
    <Layout
      title={screenTitles[currentScreen]}
      syncStatus={syncStatus}
      onBack={currentScreen !== 'HOME' && currentScreen !== 'SETUP' && currentScreen !== 'TICKETING' ? () => setCurrentScreen('HOME') : undefined}
    >
      {renderScreen()}
    </Layout>
  );
};

export default App;
