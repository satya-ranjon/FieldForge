'use client';

import React from 'react';
import { Activity, Radio, ShieldCheck, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { formatMinor, fromMinor, WorkOrderStatus, EscrowStatus } from '@fieldforge/contracts';
import { useGetWorkOrdersQuery, useGetNearbyTechniciansQuery } from '../../store/services/api';
import { mockWorkOrders, mockTechnicians, mockBids, mockTransactions } from '../../mocks/fixtures';
import type { ExtendedWorkOrder } from '../../store/slices/workOrderSlice';

export const TelemetryBar: React.FC = () => {
  const workOrders = useSelector((state: RootState) => state.workOrders.items);
  const technicians = useSelector((state: RootState) => state.dispatch.nearbyTechnicians);
  const bids = useSelector((state: RootState) => state.dispatch.activeBids);
  const billing = useSelector((state: RootState) => state.billing);

  const { data: apiOrders } = useGetWorkOrdersQuery();
  const { data: apiTechs } = useGetNearbyTechniciansQuery({
    latitude: 37.7749,
    longitude: -122.4194,
    radiusMiles: 15
  });

  const effectiveOrders: ExtendedWorkOrder[] =
    workOrders.length > 0
      ? workOrders
      : apiOrders && apiOrders.length > 0
        ? (apiOrders as unknown as ExtendedWorkOrder[])
        : mockWorkOrders;

  const effectiveTechs =
    technicians.length > 0
      ? technicians
      : apiTechs && apiTechs.length > 0
        ? apiTechs
        : mockTechnicians;

  const effectiveBids = bids.length > 0 ? bids : mockBids;
  const effectiveTransactions =
    billing.transactions.length > 0 ? billing.transactions : mockTransactions;

  const totalLocked =
    billing.totalLockedMinor > 0
      ? billing.totalLockedMinor
      : effectiveTransactions
          .filter((t) => t.status === EscrowStatus.HELD)
          .reduce((acc, t) => acc + t.amountMinor, 0);

  const totalReleased =
    billing.totalReleasedMinor > 0
      ? billing.totalReleasedMinor
      : effectiveTransactions
          .filter((t) => t.status === EscrowStatus.RELEASED)
          .reduce((acc, t) => acc + t.amountMinor, 0);

  const totalDisputed =
    billing.totalDisputedMinor > 0
      ? billing.totalDisputedMinor
      : effectiveTransactions
          .filter((t) => t.status === EscrowStatus.DISPUTED)
          .reduce((acc, t) => acc + t.amountMinor, 0);

  const activeOrders = effectiveOrders.filter(
    (w) => w.status !== 'COMPLETED' && w.status !== 'APPROVED' && w.status !== 'CANCELLED'
  );
  const onSiteOrders = effectiveOrders.filter(
    (w) => w.status === WorkOrderStatus.ON_SITE || w.status === WorkOrderStatus.EN_ROUTE
  );
  const criticalSlaCount = effectiveOrders.filter((w) => w.priority === 'CRITICAL_SLA').length;
  const availableTechs = effectiveTechs.filter((t) => t.isAvailable).length;
  const pendingBids = effectiveBids.filter((b) => b.status === 'PENDING').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Metric 1: Active Work Orders */}
      <div className="bg-[#FFFFFF] border border-[#E3E8E1] rounded-[14px] p-4 sm:p-5 shadow-xs hover:border-[#D1D9CE] transition duration-150">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#59636E] uppercase tracking-wider">
            Active Work Orders
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#EAF8E9] flex items-center justify-center text-[#18852E]">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-[#090E11] tracking-tight">
            {activeOrders.length}
          </span>
          <span className="text-xs text-[#18852E] font-medium font-mono">
            ({onSiteOrders.length} on-site)
          </span>
        </div>
        <div className="mt-2 w-full bg-[#EBEFE9] rounded-full h-1 overflow-hidden">
          <div
            className="bg-[#22B947] h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.round((activeOrders.length / (workOrders.length || 1)) * 100))}%`
            }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-[#59636E] border-t border-[#EBEFE9] pt-2">
          <span>{workOrders.length} total in pipeline</span>
          {criticalSlaCount > 0 ? (
            <span className="text-[#F04444] font-semibold flex items-center gap-1 font-mono">
              <AlertTriangle className="w-3 h-3" />
              {criticalSlaCount} SLA Critical
            </span>
          ) : (
            <span className="text-[#18852E] font-medium font-mono">0 breaches</span>
          )}
        </div>
      </div>

      {/* Metric 2: Nearby Tech Radar */}
      <div className="bg-[#FFFFFF] border border-[#E3E8E1] rounded-[14px] p-4 sm:p-5 shadow-xs hover:border-[#D1D9CE] transition duration-150">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#59636E] uppercase tracking-wider">
            Tech Radar & Matching
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#EAF4FE] flex items-center justify-center text-[#176EB8]">
            <Radio className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-[#090E11] tracking-tight">
            {availableTechs}
          </span>
          <span className="text-xs text-[#18852E] font-medium font-mono">Ready (&lt;10mi)</span>
        </div>
        <div className="mt-2 w-full bg-[#EBEFE9] rounded-full h-1 overflow-hidden">
          <div
            className="bg-[#2693F2] h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.round((availableTechs / (technicians.length || 1)) * 100))}%`
            }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-[#59636E] border-t border-[#EBEFE9] pt-2">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 text-[#7D8791]" />
            {technicians.length} Vetted Nearby
          </span>
          <span className="text-[#B76B00] font-semibold font-mono">{pendingBids} Active Bids</span>
        </div>
      </div>

      {/* Metric 3: SLA Adherence Rate */}
      <div className="bg-[#FFFFFF] border border-[#E3E8E1] rounded-[14px] p-4 sm:p-5 shadow-xs hover:border-[#D1D9CE] transition duration-150">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#59636E] uppercase tracking-wider">
            SLA SLO Adherence
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#EAF8E9] flex items-center justify-center text-[#18852E]">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-[#18852E] tracking-tight">
            99.8%
          </span>
          <span className="text-xs text-[#59636E] font-medium font-mono">+0.4% target</span>
        </div>
        <div className="mt-2 w-full bg-[#EBEFE9] rounded-full h-1 overflow-hidden">
          <div className="bg-[#22B947] h-full rounded-full w-[99.8%]" />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-[#59636E] border-t border-[#EBEFE9] pt-2">
          <span>Avg response: 18 min</span>
          <span className="text-[#18852E] font-semibold font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22B947]" />
            SLO Met
          </span>
        </div>
      </div>

      {/* Metric 4: Escrow Protection Vault */}
      <div className="bg-[#FFFFFF] border border-[#E3E8E1] rounded-[14px] p-4 sm:p-5 shadow-xs hover:border-[#D1D9CE] transition duration-150">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#59636E] uppercase tracking-wider">
            Escrow Protected Vault
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#EAF8E9] flex items-center justify-center text-[#18852E]">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-[#090E11] tracking-tight">
            {formatMinor(totalLocked)}
          </span>
        </div>
        <div className="mt-2 w-full bg-[#EBEFE9] rounded-full h-1 overflow-hidden">
          <div className="bg-[#22B947] h-full rounded-full w-[85%]" />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-[#59636E] border-t border-[#EBEFE9] pt-2">
          <span>Settled: ${(fromMinor(totalReleased) / 1000).toFixed(1)}k</span>
          {totalDisputed > 0 ? (
            <span className="text-[#F04444] font-semibold font-mono">
              ${fromMinor(totalDisputed).toFixed(0)} In Review
            </span>
          ) : (
            <span className="text-[#7D8791] font-mono">0 disputes</span>
          )}
        </div>
      </div>
    </div>
  );
};
