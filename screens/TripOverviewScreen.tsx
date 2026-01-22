
import React, { useState, useEffect } from 'react';
import { Trip, Ticket } from '../types';

interface TripOverviewScreenProps {
  trip: Trip;
  onEndTrip: () => void;
  onBack: () => void;
}

const TripOverviewScreen: React.FC<TripOverviewScreenProps> = ({ trip, onEndTrip, onBack }) => {
  const [stats, setStats] = useState({ count: 0, total: 0 });

  useEffect(() => {
    // Local calculation from stored events (simplified)
    const queueRaw = localStorage.getItem('lyncapp_event_queue') || '[]';
    const events = JSON.parse(queueRaw);
    const tripTickets = events.filter((e: any) =>
      e.type === 'TICKET_ISSUE' && e.payload.tripId === trip.id
    );

    const total = tripTickets.reduce((acc: number, curr: any) => acc + curr.payload.amount, 0);
    setStats({ count: tripTickets.length, total });
  }, [trip.id]);

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Trip Summary</h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 text-[10px] font-bold uppercase">Total Tickets</p>
              <p className="text-3xl font-black text-gray-800">{stats.count}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[10px] font-bold uppercase">Revenue (KES)</p>
              <p className="text-3xl font-black text-blue-700">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Timeline</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Departure</span>
              <span className="font-bold">{new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Duration</span>
              <span className="font-bold">
                {Math.floor((new Date().getTime() - new Date(trip.startTime).getTime()) / 60000)} mins
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1"></div>

      <div className="space-y-3">
        <button
          onClick={onBack}
          className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl active-scale text-xl flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-ticket"></i>
          CONTINUE TICKETING
        </button>
        <button
          onClick={onEndTrip}
          className="w-full bg-red-50 text-red-600 border-2 border-red-100 font-bold py-4 rounded-2xl active-scale text-lg"
        >
          CLOSE TRIP
        </button>
      </div>
    </div>
  );
};

export default TripOverviewScreen;
