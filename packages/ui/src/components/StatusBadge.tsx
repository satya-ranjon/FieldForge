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
      case 'LOW':
        return 'bg-[#F0F2F3] text-[#59636E] border-[#D5DDD2]';
      case 'PENDING':
      case 'HELD':
      case 'URGENT':
        return 'bg-[#FFF5DF] text-[#B76B00] border-[#FFE4A0]';
      case 'PUBLISHED':
      case 'ASSIGNED':
      case 'EN_ROUTE':
        return 'bg-[#EAF4FE] text-[#176EB8] border-[#BCDDFB]';
      case 'ON_SITE':
      case 'COMPLETED':
      case 'APPROVED':
      case 'PAID':
      case 'RELEASED':
      case 'STANDARD':
        return 'bg-[#E9F8EC] text-[#18852E] border-[#C3EBC2]';
      case 'CANCELLED':
      case 'DISPUTED':
      case 'REFUNDED':
      case 'CRITICAL_SLA':
        return 'bg-[#FDEAEA] text-[#C92C2C] border-[#F8C3C3]';
      default:
        return 'bg-[#F0F2F3] text-[#59636E] border-[#D5DDD2]';
    }
  };

  const isLive = ['PUBLISHED', 'EN_ROUTE', 'ON_SITE', 'CRITICAL_SLA'].includes(
    status.toUpperCase()
  );

  const sizeStyles = {
    sm: 'h-6 px-2.5 text-[11px] leading-none gap-1.5',
    md: 'h-7 px-3 text-xs leading-none gap-2'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border tracking-wide select-none',
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
