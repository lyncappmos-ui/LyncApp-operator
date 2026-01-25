
import React, { useState } from 'react';
import { DeviceConfig } from '../types';
import { api } from '../services/api';
import { unwrapCoreData } from '../services/coreAdapter';

interface SetupScreenProps {
  onComplete: (config: DeviceConfig) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState<DeviceConfig>({
    saccoCode: '',
    branch: '',
    vehicleReg: '',
    operatorPin: '',
    operatorPhone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.saccoCode || !formData.vehicleReg || !formData.operatorPin || !formData.operatorPhone) {
      setError('Required fields missing');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.getCrew([formData.operatorPhone]);
      const responseRes = await api.registerDevice(formData);
      const data = unwrapCoreData(responseRes);
      
      if (data) {
        onComplete({ ...formData, saccoName: data.saccoName });
      } else {
        throw new Error(responseRes.error || "Failed to register device");
      }
    } catch (err: any) {
      setError(err.message || 'Activation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDevBypass = () => {
    const devConfig: DeviceConfig = {
      saccoCode: 'DEV',
      branch: 'DEVELOPER_LAB',
      vehicleReg: 'KDA 001X',
      operatorPin: '0000',
      operatorPhone: '254700000000',
      saccoName: 'LYNC DEVELOPER HQ'
    };
    onComplete(devConfig);
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Logo Section */}
      <div className="py-8 flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center mb-4 transform rotate-12">
           <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M30 20C30 20 20 40 20 60C20 80 40 80 60 80C80 80 80 70 80 70" stroke="#00ACC1" strokeWidth="12" strokeLinecap="round"/>
             <path d="M30 20L70 20" stroke="#1A365D" strokeWidth="12" strokeLinecap="round"/>
             <circle cx="30" cy="20" r="10" fill="#1A365D"/>
             <circle cx="70" cy="20" r="10" fill="#1A365D"/>
             <circle cx="80" cy="70" r="10" fill="#00ACC1"/>
           </svg>
        </div>
        <h1 className="text-3xl font-black text-[#1A365D] tracking-tighter">LyncApp <span className="text-teal-500">MOS</span></h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Mobile Operator System</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="space-y-4">
          <div className="relative">
             <p className="text-[9px] font-black text-gray-400 uppercase mb-1 ml-1">Terminal Operator ID</p>
             <input
               type="tel"
               inputMode="tel"
               className="w-full bg-[#F4F7F9] p-4 rounded-2xl text-lg font-black text-[#1A365D] outline-none border-2 border-transparent focus:border-teal-500 transition-all"
               placeholder="Phone: 254..."
               value={formData.operatorPhone}
               onChange={e => setFormData({ ...formData, operatorPhone: e.target.value.replace(/\D/g, '') })}
             />
          </div>

          <div className="relative">
             <p className="text-[9px] font-black text-gray-400 uppercase mb-1 ml-1">Vehicle Registration</p>
             <input
               type="text"
               className="w-full bg-[#F4F7F9] p-4 rounded-2xl text-lg font-black text-[#1A365D] outline-none border-2 border-transparent focus:border-teal-500 transition-all uppercase"
               placeholder="KAA 000X"
               value={formData.vehicleReg}
               onChange={e => setFormData({ ...formData, vehicleReg: e.target.value.toUpperCase() })}
             />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
               <p className="text-[9px] font-black text-gray-400 uppercase mb-1 ml-1">SACCO Code</p>
               <input
                 type="text"
                 className="w-full bg-[#F4F7F9] p-4 rounded-2xl font-black text-[#1A365D] outline-none border-2 border-transparent focus:border-teal-500"
                 placeholder="CODE"
                 value={formData.saccoCode}
                 onChange={e => setFormData({ ...formData, saccoCode: e.target.value.toUpperCase() })}
               />
            </div>
            <div>
               <p className="text-[9px] font-black text-gray-400 uppercase mb-1 ml-1">Private PIN</p>
               <input
                 type="password"
                 inputMode="numeric"
                 className="w-full bg-[#F4F7F9] p-4 rounded-2xl font-black text-[#1A365D] outline-none border-2 border-transparent focus:border-teal-500 tracking-widest"
                 placeholder="****"
                 value={formData.operatorPin}
                 onChange={e => setFormData({ ...formData, operatorPin: e.target.value })}
               />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2 text-rose-600">
            <i className="fa-solid fa-triangle-exclamation text-xs"></i>
            <span className="text-[10px] font-black uppercase">{error}</span>
          </div>
        )}

        <button
          disabled={loading}
          className="w-full bg-[#1A365D] text-white font-black py-5 rounded-3xl shadow-xl active-scale disabled:opacity-50 text-lg transition-all uppercase tracking-tight mt-4"
        >
          {loading ? <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> : null}
          {loading ? 'Validating...' : 'Activate Terminal'}
        </button>
      </form>
      
      <div className="mt-6 px-6">
        <button
          onClick={handleDevBypass}
          className="w-full bg-amber-50 border-2 border-amber-200 border-dashed text-amber-700 font-black py-3 rounded-2xl active-scale text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-code"></i>
          Developer Bypass Access
        </button>
      </div>

      <div className="mt-auto py-8 text-center">
         <p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.5em]">Terminal Verified Hardware v3.1</p>
      </div>
    </div>
  );
};

export default SetupScreen;
