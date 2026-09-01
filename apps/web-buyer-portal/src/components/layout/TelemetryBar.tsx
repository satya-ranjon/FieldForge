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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Active Work Orders */}
      <Card variant="glass" className="p-4 border-slate-800 hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Active Work Orders</span>
          <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-white">{activeOrders.length}</span>
          <span className="text-xs text-blue-400 font-medium">({onSiteOrders.length} On-Site)</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
          <span>{workOrders.length} total in system</span>
          {criticalSlaCount > 0 && (
            <span className="text-red-400 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {criticalSlaCount} SLA Critical
            </span>
          )}
        </div>
      </Card>

      {/* Metric 2: Nearby Tech Radar */}
      <Card variant="glass" className="p-4 border-slate-800 hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Technicians on Radar</span>
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Radio className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-white">{availableTechs}</span>
          <span className="text-xs text-cyan-400 font-medium">Available (&lt;10mi)</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 text-slate-500" />
            {technicians.length} Vetted Nearby
          </span>
          <span className="text-amber-400 font-semibold">{pendingBids} Active Bids</span>
        </div>
      </Card>

      {/* Metric 3: SLA Adherence Rate */}
      <Card variant="glass" className="p-4 border-slate-800 hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">SLA Adherence Rate</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-emerald-400">99.8%</span>
          <span className="text-xs text-emerald-500 font-medium">+0.4% this mo.</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
          <span>Avg response: 18 min</span>
          <span className="text-emerald-400 font-semibold font-mono">0 Breaches</span>
        </div>
      </Card>

      {/* Metric 4: Escrow Protection Vault */}
      <Card variant="glass" className="p-4 border-slate-800 hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Escrow Locked Vault</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-white">
            {formatMinor(billing.totalLockedMinor)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
          <span>Total Settled: ${(fromMinor(billing.totalReleasedMinor) / 1000).toFixed(1)}k</span>
          {billing.totalDisputedMinor > 0 && (
            <span className="text-red-400 font-semibold">
              ${fromMinor(billing.totalDisputedMinor).toFixed(0)} In Review
            </span>
          )}
        </div>
      </Card>
    </div>
  );
};
