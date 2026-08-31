import React from 'react';
import { cn } from '../index';

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getBadgeStyle = (s: string) => {
    switch (s.toUpperCase()) {
      case 'PUBLISHED':
      case 'OPEN':
        return 'bg-blue-950 text-blue-400 border-blue-800';
      case 'ASSIGNED':
      case 'BIDDING':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'ON_SITE':
      case 'IN_PROGRESS':
        return 'bg-purple-950 text-purple-400 border-purple-800';
      case 'APPROVED':
      case 'SETTLED':
      case 'COMPLETED':
        return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      case 'CANCELLED':
      case 'DISPUTED':
        return 'bg-red-950 text-red-400 border-red-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        getBadgeStyle(status),
        className || ''
      )}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75 animate-pulse" />
      {status}
    </span>
  );
};
