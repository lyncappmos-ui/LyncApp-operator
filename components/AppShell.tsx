import React from 'react';
import { useConnectivity } from '../hooks/useConnectivity';
import { coreService } from '../services/coreService';

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  onBack?: () => void;
  pendingCount: number;
  isSyncing: boolean;
}

const AppShell: React.FC<AppShellProps> = ({ children, title, onBack, pendingCount, isSyncing }) => {
  const { status, isDisconnected, isDegraded } = useConnectivity();

  const handleRetry = async () => {
    await coreService.retryConnection();
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-[#F4F7F9] shadow-2xl overflow-hidden border-x border-gray-200 antialiased font-sans">
      {/* Resilient System Bar */}
      <div className="bg-[#0D1B2E] text-white px-4 py-1.5 flex justify-between items-center text-[9px] font-black tracking-widest uppercase shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isDisconnected ? 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.6)]' : isDegraded ? 'bg-amber-500' : 'bg-teal-500'}`}></div>
          <span>LYNC TERMINAL v3.1</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className={isDisconnected ? 'text-rose-400' : 'text-teal-400 opacity-80'}>
            {isDisconnected ? 'OFFLINE OPERATOR' : isDegraded ? 'DEGRADED SYNC' : 'HUB CONNECTED'}
          </span>
          {pendingCount > 0 && (
            <span className="text-amber-400 flex items-center gap-1">
              <i className="fa-solid fa-cloud-arrow-up animate-pulse"></i>
              {pendingCount}
            </span>
          )}
        </div>
      </div>

      {/* Connectivity Alert Banner */}
      {(isDisconnected || isDegraded) && (
        <div className={`${isDisconnected ? 'bg-rose-600' : 'bg-amber-500'} text-white px-4 py-2.5 flex items-center justify-between animate-in slide-in-from-top duration-300 shrink-0 shadow-lg z-20`}>
          <div className="flex items-center gap-2.5">
            <i className={`fa-solid ${isDisconnected ? 'fa-triangle-exclamation' : 'fa-wave-square'} text-xs`}></i>
            <span className="text-[10px] font-black uppercase tracking-tight">
              {isDisconnected ? 'Bridge Offline: Data Cached' : 'Hub Connection Unstable'}
            </span>
          </div>
          <button 
            onClick={handleRetry}
            className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter active-scale transition-colors backdrop-blur-sm"
          >
            Retry Bridge
          </button>
        </div>
      )}

      {/* Brand Header */}
      <header className="bg-[#1A365D] text-white px-4 py-4 flex items-center justify-between shadow-xl z-10 shrink-0">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button onClick={onBack} className="p-2 -ml-2 active-scale text-white/70 hover:text-white transition-colors">
              <i className="fa-solid fa-chevron-left text-lg"></i>
            </button>
          ) : (
            <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
               <i className="fa-solid fa-microchip text-teal-400 text-sm"></i>
            </div>
          )}
          <div className="flex flex-col">
             <span className="text-lg font-black tracking-tight leading-none">LyncApp</span>
             <span className="text-[8px] font-bold text-teal-400 tracking-[0.3em] uppercase opacity-80">Operator Terminal</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isSyncing && <i className="fa-solid fa-rotate fa-spin text-teal-400 text-xs"></i>}
          <div className="w-8 h-8 bg-white/10 rounded-full border border-white/20 flex items-center justify-center overflow-hidden">
             <i className="fa-solid fa-user-gear text-xs text-white/40"></i>
          </div>
        </div>
      </header>

      {/* Context Bar */}
      <div className="bg-white px-5 py-3 border-b border-gray-100 flex justify-between items-center shrink-0">
        <h2 className="text-gray-900 font-black uppercase text-xs tracking-tight">{title}</h2>
        <div className="flex items-center gap-2">
           <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
             {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
           </span>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#F4F7F9]">
        {children}
      </main>
      
      {/* Bottom Trim */}
      <div className="h-6 bg-white border-t border-gray-100 shrink-0 flex items-center justify-center">
         <div className="w-12 h-1 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  );
};

export default AppShell;