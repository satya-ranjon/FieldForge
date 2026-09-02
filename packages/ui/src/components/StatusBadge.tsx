import React from 'react';
import { cn } from '../index';

export interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
  showPulse?: boolean;
}

/**
 * Renders one of three server-owned vocabularies: `WorkOrderStatus`,
 * `EscrowStatus`/`BidStatus`, or an SLA priority. Statuses the backend cannot
 * produce are deliberately absent — a colour for `BIDDING` or `SETTLED` implies
 * a state the FSM (docs/SRS.md FR-WO-002) does not have, so unknown values fall
 * through to the neutral style instead of being quietly styled as if real.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  size = 'sm',
  showPulse = true
}) => {
  const getBadgeStyle = (s: string) => {
    switch (s.toUpperCase()) {
      case 'DRAFT':
      case 'PENDING':
        return 'bg-slate-800/80 text-slate-300 border-slate-700/80';
      case 'PUBLISHED':
        return 'bg-sky-950/70 text-sky-400 border-sky-800/80 shadow-[0_0_10px_rgba(56,189,248,0.15)]';
      case 'ASSIGNED':
      case 'HELD':
        return 'bg-amber-950/70 text-amber-300 border-amber-800/80';
      case 'EN_ROUTE':
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-800/80 shadow-[0_0_10px_rgba(6,182,212,0.15)]';
      case 'ON_SITE':
        return 'bg-blue-950/70 text-blue-300 border-blue-700 shadow-[0_0_10px_rgba(59,130,246,0.2)]';
      case 'COMPLETED':
      case 'APPROVED':
      case 'PAID':
      case 'RELEASED':
        return 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80 shadow-[0_0_10px_rgba(16,185,129,0.15)]';
      case 'CANCELLED':
      case 'DISPUTED':
      case 'REFUNDED':
        return 'bg-red-950/80 text-red-400 border-red-800/80 shadow-[0_0_10px_rgba(239,68,68,0.15)]';
      case 'LOW':
        return 'bg-slate-800/80 text-slate-400 border-slate-700/80';
      case 'STANDARD':
        return 'bg-blue-950/60 text-blue-300 border-blue-800/60';
      case 'URGENT':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/80';
      case 'CRITICAL_SLA':
        return 'bg-red-950/90 text-red-300 border-red-600/90 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.3)]';
      default:
        return 'bg-slate-800/80 text-slate-300 border-slate-700/80';
    }
  };

  const isLive = ['PUBLISHED', 'EN_ROUTE', 'ON_SITE', 'CRITICAL_SLA'].includes(
    status.toUpperCase()
  );

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] leading-tight gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-2'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border tracking-wide select-none backdrop-blur-xs font-mono',
        sizeStyles[size],
        getBadgeStyle(status),
        className || ''
      )}
    >
      {showPulse && isLive && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      <span>{status.replace(/_/g, ' ')}</span>
    </span>
  );
};
