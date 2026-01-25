import React, { useState } from 'react';
import { Trip } from '../types';
import { coreService } from '../services/coreService';

interface TicketScreenProps {
  trip: Trip;
  onOverview: () => void;
  onSeatMap: () => void;
  onIssueTicket: (amount: number, phone?: string) => void;
}

const TicketScreen: React.FC<TicketScreenProps> = ({ trip, onOverview, onSeatMap, onIssueTicket }) => {
  const [passengerPhone, setPassengerPhone] = useState('');
  
  const farePresets = [30, 50, 70, 100, 120, 150];

  const handleTicketAction = (amount: number) => {
    onIssueTicket(amount, passengerPhone.length >= 10 ? passengerPhone : undefined);
    setPassengerPhone('');
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Session Identity */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 shrink-0">
        <div className="w-12 h-12 bg-[#F4F7F9] rounded-xl flex items-center justify-center text-[#1A365D]">
           <i className="fa-solid fa-bus-simple text-xl"></i>
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Route Trace</p>
          <p className="font-black text-[#1A365D] tracking-tight truncate uppercase">{trip.routeName}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onSeatMap} className="bg-teal-500 text-white p-3 rounded-xl active-scale shadow-lg shadow-teal-900/10">
             <i className="fa-solid fa-couch"></i>
          </button>
          <button onClick={onOverview} className="bg-[#1A365D] text-white p-3 rounded-xl active-scale shadow-lg shadow-blue-900/10">
             <i className="fa-solid fa-chart-line"></i>
          </button>
        </div>
      </div>

      {/* Revenue Context Banner */}
      <div className="bg-[#1A365D] text-white p-4 rounded-2xl shadow-xl relative overflow-hidden shrink-0">
        <div className="relative z-10 flex justify-between items-center">
           <div>
              <p className="text-[9px] font-bold text-teal-400 uppercase mb-1 tracking-widest">Pricing Policy</p>
              <div className="flex items-center gap-2">
                 <span className="text-xl font-black uppercase">Standard Fare</span>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[9px] font-bold text-teal-400 uppercase mb-1 tracking-widest">Terminal State</p>
              <div className={`w-3 h-3 rounded-full ml-auto ${coreService.getStatus() === 'CONNECTED' ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]' : 'bg-rose-500 animate-pulse'}`}></div>
           </div>
        </div>
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-teal-500/10 rounded-full blur-xl"></div>
      </div>

      {/* Passenger Input */}
      <div className="space-y-2 shrink-0">
        <label className="text-[10px] font-black text-gray-400 uppercase px-1 tracking-widest">Passenger Mobile (Optional)</label>
        <div className="relative">
          <input
            type="tel"
            inputMode="tel"
            className="w-full bg-white border-2 border-gray-100 p-4 pl-12 rounded-2xl text-xl font-black text-[#1A365D] focus:border-teal-500 outline-none transition-all placeholder:text-gray-200 shadow-sm"
            placeholder="07XX XXX XXX"
            value={passengerPhone}
            onChange={(e) => setPassengerPhone(e.target.value.replace(/\D/g, ''))}
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-300">
             <i className="fa-solid fa-mobile-retro"></i>
          </div>
        </div>
      </div>

      {/* Fare Grid */}
      <div className="flex-1 grid grid-cols-2 gap-3 overflow-y-auto pr-1 py-1 no-scrollbar min-h-0">
        {farePresets.map(fare => (
          <button
            key={fare}
            onClick={() => handleTicketAction(fare)}
            className="bg-white border-2 border-gray-100 hover:border-teal-500 rounded-2xl p-5 shadow-sm active-scale transition-all flex flex-col items-center group active:bg-[#1A365D]"
          >
            <span className="text-gray-400 text-[9px] font-black uppercase mb-1 group-active:text-teal-400">KES</span>
            <span className="text-3xl font-black text-[#1A365D] group-active:text-white leading-none">{fare}</span>
          </button>
        ))}
      </div>

      {/* Manual Action Bar */}
      <div className="flex gap-2 pb-2 shrink-0">
         <button className="flex-1 bg-white border-2 border-gray-100 text-gray-400 font-black py-4 rounded-2xl active-scale text-[10px] uppercase tracking-widest">
           Other
         </button>
         <button 
           onClick={() => handleTicketAction(50)}
           className="flex-[2] bg-teal-500 text-white font-black py-4 rounded-2xl active-scale text-lg shadow-lg shadow-teal-500/20 uppercase tracking-tight"
         >
           Pick Seat & Issue
         </button>
      </div>
    </div>
  );
};

export default TicketScreen;