import React, { useState, useEffect } from 'react';
import { Trip, Seat } from '../types';
import { coreService } from '../services/coreService';

interface SeatMapScreenProps {
  trip: Trip;
  selectionMode?: boolean;
  onBack: () => void;
  onConfirmSelection?: (seatId: string) => void;
}

const SeatMapScreen: React.FC<SeatMapScreenProps> = ({ trip, selectionMode, onBack, onConfirmSelection }) => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSeats = async () => {
      const data = await coreService.getVehicleSeats(trip.vehicleId);
      setSeats(data);
      setLoading(false);
    };

    loadSeats();

    // Subscribe to real-time seat bookings
    const unsubscribe = coreService.on('seatBooked', (payload) => {
      if (payload.tripId === trip.id) {
        setSeats(prev => prev.map(s => 
          s.seatNumber === payload.seatNumber ? { ...s, booked: true } : s
        ));
      }
    });

    return unsubscribe;
  }, [trip.id, trip.vehicleId]);

  const handleSeatClick = (seat: Seat) => {
    if (!selectionMode || seat.booked) return;
    setSelectedSeatId(seat.seatNumber === selectedSeatId ? null : seat.seatNumber);
  };

  const finalizeBooking = () => {
    if (!selectedSeatId || !onConfirmSelection) return;
    onConfirmSelection(selectedSeatId);
  };

  const stats = {
    total: seats.length,
    booked: seats.filter(s => s.booked).length,
    available: seats.filter(s => !s.booked).length,
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-gray-400 font-black uppercase text-[10px]">Syncing Seating Plan...</div>;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header Info */}
      <div className="bg-[#0D1B2E] text-teal-400 p-4 rounded-2xl border border-teal-900/30 font-mono text-[10px] leading-tight shrink-0 shadow-lg">
        <div className="flex justify-between mb-1 opacity-60 uppercase font-black tracking-widest">
           <span>Fleet Unit: {trip.vehicleId}</span>
           <span>Mode: {selectionMode ? 'TICKETING' : 'VIEW ONLY'}</span>
        </div>
        <div className="h-px bg-teal-900/50 my-2" />
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><p className="text-gray-500">TTL</p><p className="text-white font-black">{stats.total}</p></div>
          <div><p className="text-rose-400">BOK</p><p className="text-white font-black">{stats.booked}</p></div>
          <div><p className="text-teal-400">AVL</p><p className="text-white font-black">{stats.available}</p></div>
        </div>
      </div>

      {/* Visual Terminal Map */}
      <div className="flex-1 bg-white rounded-3xl border-2 border-gray-100 p-6 flex flex-col items-center overflow-y-auto no-scrollbar shadow-inner relative">
        {selectionMode && (
          <div className="mb-4 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse border border-blue-100">
            Select an Available Seat
          </div>
        )}

        {/* Dashboard Area (Front) */}
        <div className="w-full max-w-[200px] flex justify-between items-center mb-8 px-2 opacity-10">
           <div className="w-10 h-10 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center">
             <i className="fa-solid fa-user text-xs"></i>
           </div>
           <div className="h-0.5 flex-1 bg-gray-100 mx-4"></div>
           <div className="w-10 h-10 border-2 border-gray-100 rounded-lg flex items-center justify-center">
             <i className="fa-solid fa-dharmachakra"></i>
           </div>
        </div>

        {/* Dynamic Grid Rendering */}
        <div className="grid grid-cols-4 gap-4 w-full max-w-[240px]">
          {seats.map((s) => (
            <SeatButton 
              key={s.seatNumber} 
              seat={s} 
              isSelected={selectedSeatId === s.seatNumber} 
              onClick={() => handleSeatClick(s)} 
            />
          ))}
        </div>

        <div className="mt-8 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
           <p className="text-[8px] font-bold text-gray-400 uppercase leading-relaxed tracking-wider">
             <i className="fa-solid fa-shield-halved mr-1"></i>
             Manual Editing Locked: Admin Only
           </p>
        </div>
      </div>

      {/* Footer */}
      {selectionMode ? (
        <div className="p-2 space-y-2">
           <button 
             disabled={!selectedSeatId}
             onClick={finalizeBooking}
             className={`w-full font-black py-4 rounded-2xl transition-all active-scale text-lg uppercase tracking-tight shadow-xl ${
               selectedSeatId 
                ? 'bg-teal-500 text-white shadow-teal-500/20' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
             }`}
           >
             {selectedSeatId ? `Assign Seat ${selectedSeatId}` : 'Pick Seat'}
           </button>
           <button onClick={onBack} className="w-full text-gray-400 font-black py-2 text-[10px] uppercase tracking-widest">
             Cancel
           </button>
        </div>
      ) : (
        <button
          onClick={onBack}
          className="w-full bg-[#1A365D] text-white font-black py-4 rounded-2xl active-scale text-[10px] uppercase tracking-widest shrink-0"
        >
          Return to Deck
        </button>
      )}
    </div>
  );
};

const SeatButton: React.FC<{ seat: Seat; isSelected: boolean; onClick: () => void }> = ({ seat, isSelected, onClick }) => {
  return (
    <button
      disabled={seat.booked}
      onClick={onClick}
      className={`w-12 h-14 rounded-xl border-2 flex flex-col items-center justify-center active-scale transition-all relative overflow-hidden ${
        seat.booked 
          ? "bg-rose-500 border-rose-600 text-white opacity-40" 
          : isSelected 
            ? "bg-teal-500 border-teal-600 text-white shadow-[0_4px_0_#0d9488]" 
            : "bg-gray-50 border-gray-100 text-gray-300"
      }`}
    >
      <span className="text-[10px] font-black">{seat.seatNumber}</span>
      <div className="w-6 h-0.5 bg-current/20 mt-1 rounded-full"></div>
      {seat.booked && <i className="fa-solid fa-lock absolute inset-0 m-auto text-[8px] text-white/30 pointer-events-none"></i>}
    </button>
  );
};

export default SeatMapScreen;