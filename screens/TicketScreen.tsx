
import React, { useState } from 'react';
import { Trip, Ticket } from '../types';
import { EventQueue } from '../services/eventQueue';
import { coreClient } from '../services/coreClient';

interface TicketScreenProps {
  trip: Trip;
  onOverview: () => void;
}

const TicketScreen: React.FC<TicketScreenProps> = ({ trip, onOverview }) => {
  const [passengerPhone, setPassengerPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ msg: string; type: 'info' | 'success' | 'error' } | null>(null);

  const farePresets = [30, 50, 70, 100, 120, 150];

  const issueTicket = async (amount: number) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setStatus({ msg: 'Hub Handshake...', type: 'info' });

    const ticket: Ticket = {
      id: crypto.randomUUID(),
      tripId: trip.id,
      amount,
      timestamp: new Date().toISOString(),
      passengerPhone: passengerPhone.length >= 10 ? passengerPhone : undefined,
      paymentType: 'CASH',
      synced: false
    };

    try {
      // Use coreClient for real-time reporting if connected
      if (ticket.passengerPhone) {
        // Fix: Added missing second argument 'dbKey' (set to null) to satisfy fetchCore's 3-argument signature.
        await coreClient.fetchCore(
          (api) => api.ticket(trip.id, ticket.passengerPhone!, amount),
          null,
          { success: true } // Silently fallback to "queued" mode
        );
      }

      // Always log to local queue for integrity
      EventQueue.addEvent('TICKET_ISSUE', ticket);
      setStatus({ msg: `Ticket Recorded: KES ${amount}`, type: 'success' });
      setPassengerPhone('');
      
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      // Catch-all safety: Ensure the user knows it's recorded locally
      EventQueue.addEvent('TICKET_ISSUE', ticket);
      setStatus({ msg: 'Core Unreachable: Recorded Locally', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Session Identity */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 bg-[#F4F7F9] rounded-xl flex items-center justify-center text-[#1A365D]">
           <i className="fa-solid fa-id-card-clip text-xl"></i>
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Session Trace</p>
          <p className="font-black text-[#1A365D] tracking-tight truncate">{trip.id.split('-')[0].toUpperCase()}</p>
        </div>
        <button onClick={onOverview} className="bg-teal-50 text-teal-700 p-2.5 rounded-xl active-scale">
           <i className="fa-solid fa-ellipsis-vertical"></i>
        </button>
      </div>

      {/* Revenue Context Banner */}
      <div className="bg-[#1A365D] text-white p-4 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-center">
           <div>
              <p className="text-[9px] font-bold text-teal-400 uppercase mb-1 tracking-widest">Active Tariff</p>
              <div className="flex items-center gap-2">
                 <div className="w-5 h-5 bg-teal-500 rounded flex items-center justify-center">
                   <i className="fa-solid fa-check text-[10px]"></i>
                 </div>
                 <span className="text-xl font-black">STANDARD</span>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[9px] font-bold text-teal-400 uppercase mb-1 tracking-widest">Hub Sync</p>
              <div className={`w-3 h-3 rounded-full ml-auto ${coreClient.getStatus() === 'CONNECTED' ? 'bg-teal-500' : 'bg-rose-500 animate-pulse'}`}></div>
           </div>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-teal-500/10 rounded-full"></div>
      </div>

      {/* Passenger Input */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase px-1 tracking-widest">Passenger Mobile (for SMS)</label>
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
             <i className="fa-solid fa-mobile-screen-button"></i>
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {status && (
        <div className={`p-2 rounded-lg text-center font-black text-[10px] uppercase animate-in fade-in slide-in-from-top-2 duration-300 ${
          status.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 
          status.type === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {status.msg}
        </div>
      )}

      {/* Fare Grid */}
      <div className="flex-1 grid grid-cols-2 gap-3 overflow-y-auto pr-1 py-1 no-scrollbar">
        {farePresets.map(fare => (
          <button
            key={fare}
            disabled={isProcessing}
            onClick={() => issueTicket(fare)}
            className="bg-white border-2 border-gray-100 hover:border-teal-500 rounded-2xl p-5 shadow-sm active-scale transition-all flex flex-col items-center group active:bg-teal-500"
          >
            <span className="text-gray-400 text-[9px] font-black uppercase mb-1 group-active:text-white/70">KES</span>
            <span className="text-3xl font-black text-[#1A365D] group-active:text-white leading-none">{fare}</span>
          </button>
        ))}
      </div>

      {/* Manual Confirm */}
      <div className="flex gap-2 pb-2">
         <button className="flex-1 bg-white border-2 border-gray-100 text-gray-400 font-black py-4 rounded-2xl active-scale text-[10px] uppercase tracking-widest">
           Other Amount
         </button>
         <button 
           onClick={() => issueTicket(50)}
           className="flex-[2] bg-[#00ACC1] text-white font-black py-4 rounded-2xl active-scale text-lg shadow-lg shadow-teal-500/20 uppercase tracking-tight"
         >
           Confirm Record
         </button>
      </div>
    </div>
  );
};

export default TicketScreen;
