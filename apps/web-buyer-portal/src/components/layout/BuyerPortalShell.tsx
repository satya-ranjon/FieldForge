'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header, type NavTab } from './Header';
import { TelemetryBar } from './TelemetryBar';
import { AuthModal } from '../auth/AuthModal';
import {
  Activity,
  Layers,
  Radio,
  Wallet,
  Clock,
  Building2,
  ShieldCheck,
  CheckCircle,
  Globe,
  Settings,
  Users,
  FileCheck2,
  BarChart3,
  Check,
  ChevronDown
} from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

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
  const { user } = useSelector((state: RootState) => state.auth);

  const handleOpenAuth = (mode?: 'login' | 'register') => {
    setAuthModalMode(mode || 'login');
    setIsAuthModalOpen(true);
  };

  const sidebarNavItems = [
    { id: 'operations' as NavTab, label: 'Command Center', icon: Activity },
    { id: 'create-wo' as NavTab, label: 'Work Orders / SOW', icon: Layers },
    { id: 'technicians' as NavTab, label: 'Technicians', icon: Radio },
    { id: 'billing' as NavTab, label: 'Escrow & Billing', icon: Wallet },
    { id: 'audit' as NavTab, label: 'SLA & Reports', icon: Clock }
  ];

  return (
    <div className="min-h-screen bg-[#F7F9F5] text-[#0B1114] flex font-sans selection:bg-[#A8F22D] selection:text-[#08120D] relative overflow-x-hidden">
      {/* 1. Left Operational Sidebar (Dark #081A15, width 232px) matching image 25.png */}
      <aside className="hidden lg:flex flex-col w-[232px] shrink-0 bg-[#081A15] border-r border-white/10 text-white min-h-screen sticky top-0 z-40 select-none">
        {/* Logo & Brand Header */}
        <div className="h-[66px] px-5 flex items-center justify-between border-b border-white/10">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#A8F22D] flex items-center justify-center font-black text-[#08120D] shadow-xs transition-transform group-hover:scale-105">
              <span className="text-base tracking-tighter leading-none">F</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-base tracking-tight leading-none">FieldForge</span>
              <span className="text-[10px] text-[#A8F22D] font-mono font-medium tracking-wider uppercase mt-0.5">
                Enterprise
              </span>
            </div>
          </Link>
        </div>

        {/* Organization Badge */}
        <div className="p-3 border-b border-white/5">
          <div className="flex items-center space-x-2 bg-[#10241D] px-2.5 py-2 rounded-lg border border-white/5">
            <Building2 className="w-3.5 h-3.5 text-[#A8F22D] shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">Apex Retail Corp</div>
              <div className="text-[10px] text-white/50 font-mono">b-apex-01 • Tier 1</div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Sidebar Navigation">
          <div className="px-2 pb-1 text-[10px] uppercase font-mono tracking-wider text-white/40 font-semibold">
            Operations
          </div>
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab?.(item.id)}
                className={`w-full flex items-center space-x-2.5 px-3 h-[42px] rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#A8F22D]/12 text-white font-semibold shadow-xs'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#A8F22D]' : 'text-white/60'
                  }`}
                />
                <span className="truncate">{item.label}</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#A8F22D]" />}
              </button>
            );
          })}

          <div className="pt-4 px-2 pb-1 text-[10px] uppercase font-mono tracking-wider text-white/40 font-semibold">
            Discover
          </div>
          <Link
            href="/marketing"
            className="w-full flex items-center space-x-2.5 px-3 h-[42px] rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 transition"
          >
            <Globe className="w-4 h-4 text-[#A8F22D] shrink-0" />
            <span>Public Website</span>
          </Link>
          <Link
            href="/platform"
            className="w-full flex items-center space-x-2.5 px-3 h-[42px] rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 transition"
          >
            <FileCheck2 className="w-4 h-4 text-white/60 shrink-0" />
            <span>Platform Specs</span>
          </Link>
          <Link
            href="/pricing"
            className="w-full flex items-center space-x-2.5 px-3 h-[42px] rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 transition"
          >
            <BarChart3 className="w-4 h-4 text-white/60 shrink-0" />
            <span>Pricing Tiers</span>
          </Link>
        </nav>

        {/* Operational System Health Status */}
        <div className="p-3 border-t border-white/10 space-y-2">
          <div className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-[#10241D] text-[11px] text-white/80 border border-white/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A8F22D] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A8F22D]" />
            </span>
            <span className="truncate font-medium">All Systems Operational</span>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center space-x-2.5 px-2 py-1.5 rounded-lg bg-white/5 text-xs">
            <div className="w-7 h-7 rounded-full bg-[#A8F22D] flex items-center justify-center text-[#08120D] font-bold text-xs shrink-0">
              {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'AM'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-white truncate text-xs">
                {user?.fullName || 'Alex Morgan'}
              </div>
              <div className="text-[10px] text-white/60 truncate">Operations Manager</div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Dashboard Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar matching image 25.png */}
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

        {/* Dashboard Workspace Canvas (#F7F9F5) */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-7 space-y-6">
          {/* Top KPI Telemetry Cards */}
          <TelemetryBar />

          {/* Dynamic Tab / Route View */}
          <div className="transition-all duration-150">{children}</div>
        </main>

        {/* Footer Status Bar */}
        <footer className="border-t border-[#E3E8E1] bg-[#FFFFFF] px-4 sm:px-6 py-3.5 text-[#59636E] text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3 text-center sm:text-left">
            <span className="font-semibold text-[#0B1114]">FieldForge Enterprise v1.0.0</span>
            <span className="hidden sm:inline text-[#D5DDD2]">•</span>
            <span className="font-mono text-[11px] text-[#59636E]">Node: us-west-1a (Active)</span>
            <span className="hidden sm:inline text-[#D5DDD2]">•</span>
            <span className="text-[#22B947] font-mono text-[11px] flex items-center gap-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22B947] animate-pulse" />
              99.98% SLO Target Achieved
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-[#59636E]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#22B947]" />
              AES-256 Escrow Vault
            </span>
            <span className="text-[#D5DDD2]">•</span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-[#22B947]" />
              WCAG AA 4.5:1 Compliant
            </span>
            <span className="text-[#D5DDD2]">•</span>
            <span className="font-mono text-[#7D8791]">Tokens: DESIGN.md</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
