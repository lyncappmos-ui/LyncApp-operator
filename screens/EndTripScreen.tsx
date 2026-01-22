
import React from 'react';
import { Trip } from '../types';

interface EndTripScreenProps {
  trip: Trip;
  onConfirm: () => void;
  onCancel: () => void;
}

const EndTripScreen: React.FC<EndTripScreenProps> = ({ trip, onConfirm, onCancel }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center space-y-8 text-center px-4">
      <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
        <i className="fa-solid fa-flag-checkered text-4xl"></i>
      </div>

      <div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">Complete Trip?</h2>
        <p className="text-gray-500 font-medium">
          Ensure all passengers on <span className="text-gray-800 font-bold">{trip.routeName}</span> have paid and been issued SMS tickets.
        </p>
      </div>

      <div className="w-full space-y-4">
        <button
          onClick={onConfirm}
          className="w-full bg-red-600 text-white font-black py-6 rounded-2xl shadow-xl active-scale text-2xl"
        >
          FINISH TRIP
        </button>
        <button
          onClick={onCancel}
          className="w-full bg-gray-200 text-gray-600 font-bold py-4 rounded-2xl active-scale text-lg"
        >
          NOT YET, GO BACK
        </button>
      </div>

      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-left w-full">
        <div className="flex gap-3 items-start">
          <i className="fa-solid fa-cloud-arrow-up text-blue-500 mt-1"></i>
          <p className="text-xs text-blue-800 font-medium leading-relaxed">
            Your trip data will be synced to the MOS Core immediately. If offline, the queue will sync automatically once data connection is restored.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EndTripScreen;
