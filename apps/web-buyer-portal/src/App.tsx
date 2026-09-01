import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { Header, type NavTab } from './components/layout/Header';
import { TelemetryBar } from './components/layout/TelemetryBar';
import { LiveDispatchBoard } from './components/dispatch/LiveDispatchBoard';
import { TechnicianMatchingRadar } from './components/dispatch/TechnicianMatchingRadar';
import { SowBuilder } from './components/work-orders/SowBuilder';
import { EscrowManager } from './components/billing/EscrowManager';
import { SlaAuditView } from './components/audit/SlaAuditView';

const BuyerPortalContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('operations');

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Enterprise Header with Telemetry Bar */}
      <Header activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Command Center Canvas */}
      <main className="flex-1 max-w-[1536px] w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top KPI Telemetry Row */}
        <TelemetryBar />

        {/* Dynamic Tab Views */}
        <div className="transition-all duration-150">
          {activeTab === 'operations' && <LiveDispatchBoard />}
          {activeTab === 'create-wo' && <SowBuilder />}
          {activeTab === 'technicians' && <TechnicianMatchingRadar />}
          {activeTab === 'billing' && <EscrowManager />}
          {activeTab === 'audit' && <SlaAuditView />}
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="border-t border-slate-800/80 bg-[#090d16] px-6 py-3 text-slate-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-slate-400">FieldForge Enterprise v1.0.0</span>
          <span>•</span>
          <span className="font-mono text-[11px]">Connected Node: us-west-1a</span>
          <span>•</span>
          <span className="text-emerald-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            99.98% SLO Target Met
          </span>
        </div>
        <div className="flex items-center space-x-4 text-[11px]">
          <span>AES-256 Encrypted Escrow Vault</span>
          <span>•</span>
          <span>WCAG AA 4.5:1 High Contrast</span>
          <span>•</span>
          <span>Design Tokens: DESIGN.md</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <BuyerPortalContent />
    </Provider>
  );
}
