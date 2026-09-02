'use client';

import React from 'react';
import { Activity, Radio, ShieldCheck, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { Card } from '@fieldforge/ui';
import { formatMinor, fromMinor, WorkOrderStatus } from '@fieldforge/contracts';

export const TelemetryBar: React.FC = () => {
  const workOrders = useSelector((state: RootState) => state.workOrders.items);
  const technicians = useSelector((state: RootState) => state.dispatch.nearbyTechnicians);
  const bids = useSelector((state: RootState) => state.dispatch.activeBids);
  const billing = useSelector((state: RootState) => state.billing);

  const activeOrders = workOrders.filter(
    (w) => w.status !== 'COMPLETED' && w.status !== 'APPROVED' && w.status !== 'CANCELLED'
  );
  const onSiteOrders = workOrders.filter(
    (w) => w.status === WorkOrderStatus.ON_SITE || w.status === WorkOrderStatus.EN_ROUTE
  );
  const criticalSlaCount = workOrders.filter((w) => w.priority === 'CRITICAL_SLA').length;
  const availableTechs = technicians.filter((t) => t.isAvailable).length;
  const pendingBids = bids.filter((b) => b.status === 'PENDING').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Metric 1: Active Work Orders */}
      <Card
        variant="glass"
        className="p-4 relative group hover:border-slate-700/90 transition-all duration-200"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active Work Orders
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-950/70 border border-blue-800/60 flex items-center justify-center text-blue-400 shadow-sm shadow-blue-900/30 group-hover:scale-105 transition-transform">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
            {activeOrders.length}
          </span>
          <span className="text-xs text-blue-400 font-medium font-mono">
            ({onSiteOrders.length} on-site)
          </span>
        </div>
        {/* Micro progress visual */}
        <div className="mt-2 w-full bg-slate-800/80 rounded-full h-1 overflow-hidden">
          <div
            className="bg-blue-500 h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.round((activeOrders.length / (workOrders.length || 1)) * 100))}%`
            }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
          <span>{workOrders.length} total in pipeline</span>
          {criticalSlaCount > 0 ? (
            <span className="text-red-400 font-semibold flex items-center gap-1 font-mono">
              <AlertTriangle className="w-3 h-3 animate-pulse" />
              {criticalSlaCount} SLA Critical
            </span>
          ) : (
            <span className="text-emerald-400 font-medium font-mono">0 breaches</span>
          )}
        </div>
      </Card>

      {/* Metric 2: Nearby Tech Radar */}
      <Card
        variant="glass"
        className="p-4 relative group hover:border-slate-700/90 transition-all duration-200"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Tech Radar & Matching
          </span>
          <div className="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-900/30 group-hover:scale-105 transition-transform">
            <Radio className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
            {availableTechs}
          </span>
          <span className="text-xs text-cyan-400 font-medium font-mono">Ready (&lt;10mi)</span>
        </div>
        {/* Micro progress visual */}
        <div className="mt-2 w-full bg-slate-800/80 rounded-full h-1 overflow-hidden">
          <div
            className="bg-cyan-500 h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.round((availableTechs / (technicians.length || 1)) * 100))}%`
            }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 text-slate-500" />
            {technicians.length} Vetted Nearby
          </span>
          <span className="text-amber-300 font-semibold font-mono">{pendingBids} Active Bids</span>
        </div>
      </Card>

      {/* Metric 3: SLA Adherence Rate */}
      <Card
        variant="glass"
        className="p-4 relative group hover:border-slate-700/90 transition-all duration-200"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            SLA SLO Adherence
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-900/30 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tracking-tight">
            99.8%
          </span>
          <span className="text-xs text-emerald-500/90 font-medium font-mono">+0.4% target</span>
        </div>
        {/* Micro progress visual */}
        <div className="mt-2 w-full bg-slate-800/80 rounded-full h-1 overflow-hidden">
          <div className="bg-emerald-500 h-full rounded-full w-[99.8%]" />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
          <span>Avg response: 18 min</span>
          <span className="text-emerald-400 font-semibold font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            SLO Met
          </span>
        </div>
      </Card>

      {/* Metric 4: Escrow Protection Vault */}
      <Card
        variant="glass"
        className="p-4 relative group hover:border-slate-700/90 transition-all duration-200"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Escrow Protected Vault
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-950/70 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shadow-sm shadow-indigo-900/30 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
            {formatMinor(billing.totalLockedMinor)}
          </span>
        </div>
        {/* Micro progress visual */}
        <div className="mt-2 w-full bg-slate-800/80 rounded-full h-1 overflow-hidden">
          <div className="bg-indigo-500 h-full rounded-full w-[85%]" />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
          <span>Settled: ${(fromMinor(billing.totalReleasedMinor) / 1000).toFixed(1)}k</span>
          {billing.totalDisputedMinor > 0 ? (
            <span className="text-red-400 font-semibold font-mono">
              ${fromMinor(billing.totalDisputedMinor).toFixed(0)} In Review
            </span>
          ) : (
            <span className="text-slate-400 font-mono">0 disputes</span>
          )}
        </div>
      </Card>
    </div>
  );
};
