import React from 'react';
import { cn } from '../index';

export interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
  showPulse?: boolean;
}

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
        return 'bg-slate-800/80 text-slate-300 border-slate-700';
      case 'PUBLISHED':
      case 'OPEN':
      case 'MATCHING':
      case 'DISPATCHED':
        return 'bg-sky-950/80 text-sky-400 border-sky-800/80 shadow-sm shadow-sky-950/50';
      case 'ASSIGNED':
      case 'BIDDING':
      case 'HELD':
        return 'bg-amber-950/80 text-amber-400 border-amber-800/80';
      case 'EN_ROUTE':
        return 'bg-cyan-950/80 text-cyan-400 border-cyan-800/80';
      case 'ON_SITE':
      case 'IN_PROGRESS':
        return 'bg-blue-950/80 text-blue-400 border-blue-700 shadow-sm shadow-blue-900/40';
      case 'REVIEW':
      case 'COMPLETED':
      case 'APPROVED':
      case 'SETTLED':
      case 'PAID':
      case 'RELEASED':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80 shadow-sm shadow-emerald-950/50';
      case 'CANCELLED':
      case 'DISPUTED':
      case 'REFUNDED':
      case 'FAILED':
        return 'bg-red-950/80 text-red-400 border-red-800/80';
      case 'LOW':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      case 'STANDARD':
        return 'bg-blue-950/60 text-blue-400 border-blue-800/60';
      case 'URGENT':
        return 'bg-amber-950/90 text-amber-300 border-amber-700';
      case 'CRITICAL_SLA':
        return 'bg-red-950/90 text-red-300 border-red-600 animate-pulse';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const isLive = [
    'PUBLISHED',
    'MATCHING',
    'DISPATCHED',
    'EN_ROUTE',
    'ON_SITE',
    'IN_PROGRESS',
    'CRITICAL_SLA'
  ].includes(status.toUpperCase());

  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border tracking-wide select-none',
        sizeStyles[size],
        getBadgeStyle(status),
        className || ''
      )}
    >
      {showPulse && isLive && (
        <span className="relative flex h-2 w-2 mr-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {status.replace(/_/g, ' ')}
    </span>
  );
};
