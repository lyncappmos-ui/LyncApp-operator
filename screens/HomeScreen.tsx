
import React from 'react';
import { DeviceConfig, Trip } from '../types';

interface HomeScreenProps {
  device: DeviceConfig;
  activeTrip: Trip | null;
  onStartTrip: () => void;
  onResumeTrip: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ device, activeTrip, onStartTrip, onResumeTrip }) => {
  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Dashboard Filter Bar Mockup */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {['All', 'Active', 'Ready', 'Delayed'].map((filter, i) => (
          <button 
            key={filter}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border whitespace-nowrap ${i === 1 ? 'bg-[#1A365D] text-white border-[#1A365D]' : 'bg-white text-gray-400 border-gray-200'}`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Main Status Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Vehicle Status</span>
            <div className="flex items-center gap-2">
               <h3 className="text-2xl font-black text-[#1A365D]">{device.vehicleReg}</h3>
               {activeTrip ? (
                 <span className="bg-teal-100 text-teal-700 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter flex items-center gap-1">
                   <span className="w-1 h-1 bg-teal-500 rounded-full"></span>
                   Active
                 </span>
               ) : (
                 <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                   Idle
                 </span>
               )}
            </div>
          </div>
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-[#1A365D]">
            <i className="fa-solid fa-bus text-xl"></i>
          </div>
        </div>

        {activeTrip && (
          <div className="p-5 bg-teal-50/30">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-white rounded-lg border border-teal-100 flex items-center justify-center text-teal-600 shadow-sm">
                <i className="fa-solid fa-route"></i>
              </div>
              <div>
                <p className="text-[10px] font-bold text-teal-600 uppercase tracking-tight">Current Route</p>
                <p className="text-lg font-black text-gray-800 leading-tight">{activeTrip.routeName}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-3 rounded-xl border border-teal-100">
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Started</p>
                  <p className="text-sm font-black text-[#1A365D]">
                    {new Date(activeTrip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
               </div>
               <div className="bg-white p-3 rounded-xl border border-teal-100">
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Capacity</p>
                  <p className="text-sm font-black text-[#1A365D]">14 Seater</p>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
        {!activeTrip ? (
           <div className="space-y-4">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-xl border border-gray-100 flex items-center justify-center text-gray-200 mx-auto">
                 <i className="fa-solid fa-map-location-dot text-3xl"></i>
              </div>
              <div>
                <h4 className="font-black text-gray-800">No Active Session</h4>
                <p className="text-xs text-gray-400 font-medium">Please initiate a new trip to start collecting revenue.</p>
              </div>
           </div>
        ) : null}
      </div>

      {/* Action Buttons */}
      <div className="pb-4">
        {!activeTrip ? (
          <button
            onClick={onStartTrip}
            className="w-full bg-[#00ACC1] hover:bg-[#0097a7] text-white font-black py-5 rounded-2xl shadow-lg active-scale text-xl flex items-center justify-center gap-3 transition-colors uppercase tracking-tight"
          >
            <i className="fa-solid fa-play-circle"></i>
            Initialize Trip
          </button>
        ) : (
          <button
            onClick={onResumeTrip}
            className="w-full bg-[#1A365D] hover:bg-[#152c4d] text-white font-black py-5 rounded-2xl shadow-xl active-scale text-xl flex items-center justify-center gap-3 transition-colors uppercase tracking-tight"
          >
            <i className="fa-solid fa-cash-register"></i>
            Revenue Deck
          </button>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
