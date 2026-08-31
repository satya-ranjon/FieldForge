import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { LiveDispatchBoard } from './components/dispatch/LiveDispatchBoard';
import { SowBuilder } from './components/work-orders/SowBuilder';
import { EscrowManager } from './components/billing/EscrowManager';

export default function App() {
  return (
    <Provider store={store}>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">⚡</div>
            <h1 className="text-xl font-bold tracking-tight text-white">FieldForge <span className="text-blue-500 font-normal">Buyer Hub</span></h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs px-3 py-1 bg-blue-950 text-blue-400 border border-blue-800 rounded-full">Apex Retail Corp (Buyer)</span>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <LiveDispatchBoard />
              <SowBuilder />
            </div>
            <div className="space-y-6">
              <EscrowManager />
            </div>
          </div>
        </main>
      </div>
    </Provider>
  );
}
