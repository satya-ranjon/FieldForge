import React from 'react';
import { cn } from '../index';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'green' | 'blue' | 'amber' | 'red' | 'outline' | 'neutral';
  size?: 'sm' | 'md';
  showDot?: boolean;
  dotPulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'sm',
  showDot = false,
  dotPulse = false,
  ...props
}) => {
  const variants = {
    default: 'bg-[#EAF8E9] text-[#18852E] border-[#C3EBC2]',
    green: 'bg-[#EAF8E9] text-[#18852E] border-[#C3EBC2]',
    blue: 'bg-[#E9F4FE] text-[#176EB8] border-[#BCDDFB]',
    amber: 'bg-[#FFF4DD] text-[#B76B00] border-[#FFE4A0]',
    red: 'bg-[#FDEAEA] text-[#C92C2C] border-[#F8C3C3]',
    outline: 'border border-[#DDE4DA] text-[#0B1114] bg-transparent',
    neutral: 'bg-[#F0F2F3] text-[#59636E] border-[#D5DDD2]'
  };

  const sizes = {
    sm: 'h-6 px-2.5 text-[11px] leading-none gap-1.5',
    md: 'h-7 px-3 text-xs leading-none gap-2'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border tracking-wide select-none',
        variants[variant],
        sizes[size],
        className || ''
      )}
      {...props}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {dotPulse && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          )}
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
};
