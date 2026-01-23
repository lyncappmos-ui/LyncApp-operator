

import React from 'react';
import { SyncStatus, ConnectionStatus } from '../types';
// Fix: Updated import to use coreService as coreClient is deprecated
import { coreService } from '../services/coreService';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  syncStatus: SyncStatus;
  onBack?: () => void;
}

const Logo = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 20C30 20 20 40 20 60C20 80 40 80 60 80C80 80 80 70 80 70" stroke="#00ACC1" strokeWidth="12" strokeLinecap="round"/>
    <path d="M30 20L70 20" stroke="#1A365D" strokeWidth="12" strokeLinecap="round"/>
    <circle cx="30" cy="20" r="10" fill="#1A365D"/>
    <circle cx="70" cy="20" r="10" fill="#1A365D"/>
    <circle cx="80" cy="70" r="10" fill="#00ACC1"/>
  </svg>
);

const Layout: React.FC<LayoutProps> = ({ children, title, syncStatus, onBack }) => {
  const isDisconnected = syncStatus.connectionState === 'DISCONNECTED';
  const isDegraded = syncStatus.connectionState === 'DEGRADED';

  const handleRetry = async () => {
    // Fix: Updated usage to use coreService
    await coreService.retryConnection();
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-[#F4F7F9] shadow-2xl overflow-hidden border-x border-gray-200">
      {/* Top System Bar */}
      <div className="bg-[#0D1B2E] text-white px-4 py-1.5 flex justify-between items-center text-[10px] font-bold tracking-widest uppercase">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-signal text-[8px]"></i>
          <span>LYNC MOS v3.1</span>
        </div>
        <div className="flex gap-3 items-center">
          <span className={`${!isDisconnected ? 'text-teal-400' : 'text-rose-400'}`}>
            {!isDisconnected ? 'SYNC ACTIVE' : 'LOCAL MODE'}
          </span>
          {syncStatus.pendingCount > 0 && (
            <span className="text-amber-400 animate-pulse">
              {syncStatus.pendingCount} QUEUED
            </span>
          )}
        </div>
      </div>

      {/* Circuit Breaker Alert */}
      {(isDisconnected || isDegraded) && (
        <div className={`${isDisconnected ? 'bg-rose-600' : 'bg-amber-500'} text-white px-4 py-2 flex items-center justify-between animate-in slide-in-from-top duration-300`}>
          <div className="flex items-center gap-2">
            <i className={`fa-solid ${isDisconnected ? 'fa-plug-circle-xmark' : 'fa-triangle-exclamation'} text-xs`}></i>
            <span className="text-[10px] font-bold uppercase tracking-tight">
              {isDisconnected ? 'Core Unreachable - Offline Ops' : 'Core Connection Unstable'}
            </span>
          </div>
          <button 
            onClick={handleRetry}
            className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter active-scale transition-colors"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Brand Header */}
      <header className="bg-[#1A365D] text-white px-4 py-4 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button onClick={onBack} className="p-2 -ml-2 active-scale">
              <i className="fa-solid fa-arrow-left text-lg"></i>
            </button>
          ) : (
            <Logo />
          )}
          <div className="flex flex-col">
             <span className="text-lg font-black tracking-tight leading-none">LyncApp</span>
             <span className="text-[9px] font-bold text-teal-400 tracking-[0.2em] uppercase">Terminal</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="relative active-scale">
            <i className="fa-solid fa-bell text-gray-300"></i>
            {syncStatus.pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
            )}
          </button>
          <div className="w-9 h-9 bg-teal-500 rounded-full border-2 border-white/20 flex items-center justify-center overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
          </div>
        </div>
      </header>

      {/* Sub Header / Breadcrumb */}
      <div className="bg-white px-5 py-3 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-gray-800 font-black uppercase text-sm tracking-tight">{title}</h2>
        {syncStatus.isSyncing && <div className="w-2 h-2 bg-teal-500 rounded-full animate-ping"></div>}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {children}
      </main>
      
      {/* Bottom Soft Keys Placeholder */}
      <div className="h-2 bg-gray-200 w-1/3 mx-auto rounded-full mb-2 shrink-0 opacity-20"></div>
    </div>
  );
};

export default Layout;