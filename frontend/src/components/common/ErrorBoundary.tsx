import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in DineFlow App:', error, errorInfo);
  }

  public handleReset = () => {
    try {
      localStorage.clear();
    } catch (e) {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-6 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Application Exception Detected</h2>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                An unexpected state error occurred. You can reset the local session cache to restore clean operation.
              </p>
              {this.state.error && (
                <div className="mt-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] font-mono text-rose-300 text-left max-h-32 overflow-y-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <button
              onClick={this.handleReset}
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Local Cache & Reload</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
