'use client';

import React, { useState } from 'react';
import { Header, type NavTab } from './Header';
import { TelemetryBar } from './TelemetryBar';
import { AuthModal } from '../auth/AuthModal';
import { ShieldCheck, CheckCircle } from 'lucide-react';

interface BuyerPortalShellProps {
  children: React.ReactNode;
  activeTab?: NavTab;
  onSelectTab?: (tab: NavTab) => void;
}

export const BuyerPortalShell: React.FC<BuyerPortalShellProps> = ({
  children,
  activeTab = 'operations',
  onSelectTab
}) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const handleOpenAuth = (mode?: 'login' | 'register') => {
    setAuthModalMode(mode || 'login');
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Ambient background glow (Linear-inspired) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial from-blue-600/10 via-cyan-500/5 to-transparent pointer-events-none blur-3xl z-0" />

      {/* Enterprise Header with Telemetry Bar */}
      <Header
        activeTab={activeTab}
        onSelectTab={onSelectTab || (() => {})}
        onOpenAuth={handleOpenAuth}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Main Command Center Canvas */}
      <main className="flex-1 max-w-[1536px] w-full mx-auto p-3 sm:p-5 lg:p-6 space-y-5 sm:space-y-6 relative z-10">
        {/* Top KPI Telemetry Row */}
        <TelemetryBar />

        {/* Dynamic Tab / Route View */}
        <div className="transition-all duration-200">{children}</div>
      </main>

      {/* Footer Status Bar */}
      <footer className="border-t border-slate-800/80 bg-[#090d16]/95 backdrop-blur-md px-4 sm:px-6 py-3 text-slate-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3 text-center sm:text-left">
          <span className="font-semibold text-slate-300">FieldForge Enterprise v1.0.0</span>
          <span className="hidden sm:inline">•</span>
          <span className="font-mono text-[11px] text-slate-400">Node: us-west-1a (Active)</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            99.98% SLO Target Achieved
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            AES-256 Escrow Vault
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            WCAG AA 4.5:1 Compliant
          </span>
          <span>•</span>
          <span className="font-mono text-slate-500">Tokens: DESIGN.md</span>
        </div>
      </footer>
    </div>
  );
};
