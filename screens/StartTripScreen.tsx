import React, { useEffect, useState } from 'react';
import { Route } from '../types';
import { coreService } from '../services/coreService';

interface StartTripScreenProps {
  onStart: (route: Route) => void;
  onBack: () => void;
}

const StartTripScreen: React.FC<StartTripScreenProps> = ({ onStart, onBack }) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await coreService.fetchRoutes();
        setRoutes(data);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white/50 rounded-3xl">
        <i className="fa-solid fa-spinner fa-spin text-3xl mb-4 text-[#1A365D]"></i>
        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Querying Active Routes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-1">
         <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Fleets</h2>
         <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase ${coreService.getStatus() === 'CONNECTED' ? 'bg-teal-100 text-teal-700' : 'bg-rose-100 text-rose-700'}`}>
           {coreService.getStatus() === 'CONNECTED' ? 'Hub Data' : 'Cached Data'}
         </span>
      </div>
      
      <div className="space-y-3">
        {routes.map(route => (
          <button
            key={route.id}
            onClick={() => onStart(route)}
            className="w-full bg-white p-6 rounded-[2rem] shadow-sm border-2 border-gray-100 flex items-center justify-between active-scale hover:border-teal-500 transition-all text-left"
          >
            <div>
              {/* Fix: Route interface does not have a 'name' property, use origin and destination instead */}
              <p className="text-lg font-black text-[#1A365D] leading-tight">{route.origin} → {route.destination}</p>
              <p className="text-gray-400 text-[10px] font-bold uppercase mt-1 tracking-wider">
                Standard Tariff: <span className="text-teal-600 font-black">KES {route.standardFare}</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
              <i className="fa-solid fa-chevron-right text-xs"></i>
            </div>
          </button>
        ))}
        
        {routes.length === 0 && (
          <div className="p-12 text-center text-gray-400 italic text-sm">
            No routes available in current context.
          </div>
        )}
      </div>

      <div className="pt-4">
        <button
          onClick={onBack}
          className="w-full bg-white border-2 border-gray-100 text-gray-400 font-black py-4 rounded-2xl active-scale text-[10px] uppercase tracking-[0.2em]"
        >
          Cancel Operation
        </button>
      </div>
    </div>
  );
};

export default StartTripScreen;
