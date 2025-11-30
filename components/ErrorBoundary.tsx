
import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 h-full text-center bg-red-50 rounded-3xl border-4 border-red-100 min-h-[300px] w-full">
          <AlertTriangle size={48} className="text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Oops! Something went wrong.</h2>
          <p className="text-red-700 mb-6 max-w-xs mx-auto">Don't worry, we can fix it!</p>
          <button 
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="bg-red-500 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-red-600 shadow-lg hover:scale-105 transition-transform"
          >
            <RotateCcw /> Restart App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
