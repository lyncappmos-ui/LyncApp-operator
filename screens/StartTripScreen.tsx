
import React, { useEffect, useState } from 'react';
import { Route } from '../types';
import { coreClient } from '../services/coreClient';

interface StartTripScreenProps {
  onStart: (route: Route) => void;
  onBack: () => void;
}

const StartTripScreen: React.FC<StartTripScreenProps> = ({ onStart, onBack }) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const localRoutes: Route[] = [
          { id: 'offline-1', name: 'Standard Route (Offline)', standardFare: 50 }
        ];
        
        const data = await coreClient.fetchCore(
          (api) => api.getRoutes(),
          localRoutes
        );
        
        setRoutes(data);
      } catch (err) {
        console.error("Failed to load routes", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoutes();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-4 text-[#1A365D]"></i>
        <p className="text-xs font-bold uppercase tracking-widest">Accessing Fleet Routes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Active Fleet Routes</h2>
      <div className="space-y-3">
        {routes.map(route => (
          <button
            key={route.id}
            onClick={() => onStart(route)}
            className="w-full bg-white p-6 rounded-[2rem] shadow-sm border-2 border-gray-100 flex items-center justify-between active-scale hover:border-teal-500 transition-colors"
          >
            <div className="text-left">
              <p className="text-lg font-black text-[#1A365D] leading-tight">{route.name}</p>
              <p className="text-gray-400 text-[10px] font-bold uppercase mt-1 tracking-wider">
                Base Fare: <span className="text-teal-600 font-black">KES {route.standardFare}</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
              <i className="fa-solid fa-chevron-right text-xs"></i>
            </div>
          </button>
        ))}
      </div>

      <div className="pt-4">
        <button
          onClick={onBack}
          className="w-full bg-white border-2 border-gray-100 text-gray-400 font-black py-4 rounded-2xl active-scale text-[10px] uppercase tracking-[0.2em]"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default StartTripScreen;
