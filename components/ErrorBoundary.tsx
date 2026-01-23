import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0D1B2E] text-white p-6 text-center">
          <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center mb-6">
            <i className="fa-solid fa-triangle-exclamation text-4xl text-rose-500"></i>
          </div>
          <h1 className="text-2xl font-black mb-2 tracking-tight">System Fault Detected</h1>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            The terminal encountered a critical error. Local trip data remains safe.
          </p>
          <div className="w-full max-w-xs space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-teal-500 text-white font-black py-4 rounded-2xl active-scale shadow-lg shadow-teal-500/20 uppercase tracking-widest text-xs"
            >
              Restart Interface
            </button>
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="w-full bg-white/5 text-gray-400 font-bold py-3 rounded-xl text-[10px] uppercase tracking-widest"
            >
              Reset Cache & Reboot
            </button>
          </div>
          {this.state.error && (
            <div className="mt-12 p-3 bg-black/30 rounded-lg text-left w-full max-w-xs border border-white/5">
              <p className="text-[8px] font-mono text-gray-500 break-all leading-tight">
                {this.state.error.toString()}
              </p>
            </div>
          )}
        </div>
      );
    }

    // Fix: Access children through this.props in a class component
    return this.props.children;
  }
}

export default ErrorBoundary;