import React from 'react';
import {
  Zap,
  Activity,
  ShieldCheck,
  Building2,
  Bell,
  Layers,
  Radio,
  Wallet,
  Clock
} from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

export type NavTab = 'operations' | 'create-wo' | 'technicians' | 'billing' | 'audit';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab }) => {
  const workOrders = useSelector((state: RootState) => state.workOrders.items);
  const totalLocked = useSelector((state: RootState) => state.billing.totalLocked);
  const activeCount = workOrders.filter(
    (w) => w.status !== 'COMPLETED' && w.status !== 'APPROVED' && w.status !== 'CANCELLED'
  ).length;

  const navItems = [
    {
      id: 'operations' as NavTab,
      label: 'Live Operations & FSM',
      icon: Activity,
      badge: activeCount
    },
    { id: 'create-wo' as NavTab, label: 'SOW Studio & Create', icon: Layers },
    { id: 'technicians' as NavTab, label: 'Technician Radar & Bids', icon: Radio, pulse: true },
    { id: 'billing' as NavTab, label: 'Escrow Vault & Ledger', icon: Wallet },
    { id: 'audit' as NavTab, label: 'SLA & Telemetry Audit', icon: Clock }
  ];

  return (
    <header className="border-b border-slate-800/90 bg-[#090d16]/95 backdrop-blur-md sticky top-0 z-40">
      {/* Top Banner: Enterprise Context & System Telemetry */}
      <div className="px-6 py-2.5 border-b border-slate-800/60 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm shadow-blue-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-bold text-white text-sm tracking-tight">FieldForge</span>
              <span className="text-blue-400 font-mono font-medium text-xs">
                ENTERPRISE BUYER HUB
              </span>
            </div>
          </div>

          <span className="text-slate-700">|</span>

          {/* Buyer Organization Switcher */}
          <div className="flex items-center space-x-2 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-200 font-medium">Apex Retail Corp</span>
            <span className="text-slate-500 font-mono text-[10px]">(ID: b-apex-01)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-semibold border border-blue-800/60">
              Tier 1 Enterprise
            </span>
          </div>
        </div>

        {/* Live Cluster Heartbeat Telemetry */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-slate-400 text-[11px]">AMQP & Redis GEOSTREAM:</span>
            <span className="text-emerald-400 font-mono font-semibold text-[11px]">
              ACTIVE (12ms)
            </span>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400 text-[11px]">Escrow Vault:</span>
            <span className="text-emerald-400 font-mono font-bold text-[11px]">
              ${totalLocked.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-slate-400">
            <button
              className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="px-4 sm:px-6 py-2 flex items-center justify-between gap-2 overflow-hidden">
        <nav
          className="flex space-x-1 overflow-x-auto min-w-0 flex-1 py-0.5"
          aria-label="Main Navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 select-none shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-blue-800 text-blue-100'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.pulse && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping ml-1" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-200">
              Satya Ranjan (Lead Dispatcher)
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Role: BUYER_ADMIN</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400">
            SR
          </div>
        </div>
      </div>
    </header>
  );
};
