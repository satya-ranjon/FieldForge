'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Zap,
  Activity,
  ShieldCheck,
  Building2,
  Bell,
  Layers,
  Radio,
  Wallet,
  Clock,
  ChevronDown,
  LogIn,
  LogOut,
  User as UserIcon,
  Check
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { formatMinor, EscrowStatus } from '@fieldforge/contracts';
import { logout } from '../../store/slices/authSlice';
import type { RootState } from '../../store';
import { useGetWorkOrdersQuery } from '../../store/services/api';
import { mockWorkOrders, mockTransactions } from '../../mocks/fixtures';
import type { ExtendedWorkOrder } from '../../store/slices/workOrderSlice';

export type NavTab = 'operations' | 'create-wo' | 'technicians' | 'billing' | 'audit';

const routeMap: Record<NavTab, string> = {
  operations: '/operations',
  'create-wo': '/create-wo',
  technicians: '/technicians',
  billing: '/billing',
  audit: '/audit'
};

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab, onOpenAuth }) => {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const router = useRouter();

  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const getTabFromPath = (path: string | null): NavTab => {
    if (path === '/create-wo') return 'create-wo';
    if (path === '/technicians') return 'technicians';
    if (path === '/billing') return 'billing';
    if (path === '/audit') return 'audit';
    if (path === '/operations' || path === '/') return 'operations';
    return activeTab || 'operations';
  };

  const currentTab = getTabFromPath(pathname);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const workOrders = useSelector((state: RootState) => state.workOrders.items);
  const totalLockedMinor = useSelector((state: RootState) => state.billing.totalLockedMinor);
  const transactions = useSelector((state: RootState) => state.billing.transactions);

  const { data: apiOrders } = useGetWorkOrdersQuery();

  const effectiveOrders: ExtendedWorkOrder[] =
    workOrders.length > 0
      ? workOrders
      : apiOrders && apiOrders.length > 0
        ? (apiOrders as unknown as ExtendedWorkOrder[])
        : mockWorkOrders;

  const effectiveTransactions = transactions.length > 0 ? transactions : mockTransactions;

  const effectiveLocked =
    totalLockedMinor > 0
      ? totalLockedMinor
      : effectiveTransactions
          .filter((t) => t.status === EscrowStatus.HELD)
          .reduce((acc, t) => acc + t.amountMinor, 0);

  const activeCount = effectiveOrders.filter(
    (w) => w.status !== 'COMPLETED' && w.status !== 'APPROVED' && w.status !== 'CANCELLED'
  ).length;

  const navItems = [
    {
      id: 'operations' as NavTab,
      label: 'Live Operations',
      sublabel: 'FSM & Dispatch',
      icon: Activity,
      badge: activeCount
    },
    {
      id: 'create-wo' as NavTab,
      label: 'SOW Studio',
      sublabel: 'Create Ticket',
      icon: Layers
    },
    {
      id: 'technicians' as NavTab,
      label: 'Technician Radar',
      sublabel: 'Geo-Matching & Bids',
      icon: Radio,
      pulse: true
    },
    {
      id: 'billing' as NavTab,
      label: 'Escrow Vault',
      sublabel: 'Ledger & Audit',
      icon: Wallet
    },
    {
      id: 'audit' as NavTab,
      label: 'SLA Telemetry',
      sublabel: 'SLO Observability',
      icon: Clock
    }
  ];

  return (
    <header className="border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-xl sticky top-0 z-40">
      {/* Top Banner: Enterprise Identity & Live Infrastructure Telemetry */}
      <div className="px-4 sm:px-6 py-2 border-b border-slate-800/50 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Brand & Organization Identity */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-white shadow-md shadow-blue-600/30 border border-blue-400/30 ring-1 ring-blue-500/20">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-bold text-white text-base tracking-tight">FieldForge</span>
              <span className="text-[10px] uppercase font-mono font-semibold tracking-wider px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/50">
                Enterprise
              </span>
            </div>
          </div>

          <span className="hidden sm:inline text-slate-700">/</span>

          {/* Buyer Organization Switcher */}
          <div className="hidden sm:flex items-center space-x-2 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800/80 hover:border-slate-700 transition cursor-pointer">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-200 font-medium text-xs">Apex Retail Corp</span>
            <span className="text-slate-500 font-mono text-[10px] hidden md:inline">
              (b-apex-01)
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950/80 text-emerald-400 font-semibold border border-emerald-800/60 font-mono">
              Tier 1
            </span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </div>
        </div>

        {/* Live Cluster Heartbeat Telemetry & Escrow */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* GeoStream AMQP Heartbeat */}
          <div className="flex items-center space-x-2 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800/80">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-slate-400 text-[11px] hidden md:inline">AMQP GEOSTREAM:</span>
            <span className="text-emerald-400 font-mono font-semibold text-[11px]">
              ONLINE <span className="text-slate-500 font-normal hidden lg:inline">(12ms)</span>
            </span>
          </div>

          {/* Escrow Vault Chip */}
          <div className="flex items-center space-x-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800/80">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400 text-[11px] hidden sm:inline">Escrow:</span>
            <span className="text-emerald-400 font-mono font-bold text-[11px]">
              {formatMinor(effectiveLocked)}
            </span>
          </div>

          {/* Notification Alert Bell */}
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition focus:outline-none focus:ring-2 focus:ring-blue-500 relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[#090d16]" />
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
        {/* Navigation Tabs (Scrollable on small screens) */}
        <nav
          className="flex space-x-1 sm:space-x-1.5 overflow-x-auto min-w-0 flex-1 py-1 no-scrollbar"
          aria-label="Main Navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab?.(item.id);
                  try {
                    router.push(routeMap[item.id]);
                  } catch {
                    // fallback
                  }
                }}
                className={`relative flex items-center space-x-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 select-none shrink-0 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                />
                <span className="font-semibold tracking-tight">{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-blue-800/90 text-blue-100 border border-blue-400/40'
                        : 'bg-slate-800 text-slate-300 border border-slate-700/80'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.pulse && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse ml-0.5" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Identity & Avatar / Sign In */}
        <div className="relative shrink-0 pl-2" ref={menuRef}>
          {isAuthenticated && user ? (
            <div>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-slate-800/60 transition cursor-pointer select-none text-left"
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {user.companyName || user.fullName || user.email.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-blue-400 font-mono font-medium">{user.role}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 border border-blue-400/40 flex items-center justify-center font-bold text-xs text-white shadow-sm shadow-black/50 ring-2 ring-blue-500/10">
                  {user.fullName
                    ? user.fullName.substring(0, 2).toUpperCase()
                    : user.email.substring(0, 2).toUpperCase()}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0f172a] border border-slate-800 shadow-2xl shadow-blue-950/40 p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2 border-b border-slate-800/80 space-y-1">
                    <div className="font-semibold text-slate-200 truncate">
                      {user.companyName || user.fullName}
                    </div>
                    <div className="text-slate-400 text-[11px] truncate flex items-center gap-1 font-mono">
                      <UserIcon className="w-3 h-3 text-blue-400" />
                      {user.email}
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-800/60 font-semibold">
                        {user.role}
                      </span>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Active Session
                      </span>
                    </div>
                  </div>

                  <div className="p-1 pt-2">
                    <button
                      onClick={() => {
                        dispatch(logout());
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition text-left cursor-pointer font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth?.('login')}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/30 transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
