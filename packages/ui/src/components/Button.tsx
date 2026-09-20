import React from 'react';
import { cn } from '../index';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'dark' | 'danger' | 'outline' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  shape?: 'default' | 'pill';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  shape = 'default',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

  const shapes = {
    default: 'rounded-xl',
    pill: 'rounded-full'
  };

  const variants = {
    primary:
      'bg-[#A8F22D] text-[#08120D] hover:bg-[#94DC20] active:bg-[#82C719] focus-visible:ring-[#A8F22D] shadow-xs border border-[#94DC20]',
    secondary:
      'bg-[#FFFFFF] text-[#0B1114] hover:bg-[#F8FAF7] active:bg-[#EBEFE9] focus-visible:ring-[#A8F22D] border border-[#DDE4DA] shadow-xs',
    dark: 'bg-[#081A15] text-[#FFFFFF] hover:bg-[#153028] active:bg-[#0D211B] focus-visible:ring-[#A8F22D] border border-white/10 shadow-xs',
    danger:
      'bg-[#F04444] text-[#FFFFFF] hover:bg-[#DC2626] active:bg-[#B91C1C] focus-visible:ring-[#F04444] shadow-xs border border-red-500/30',
    outline:
      'border border-[#DDE4DA] text-[#0B1114] hover:bg-[#F8FAF7] active:bg-[#EBEFE9] focus-visible:ring-[#A8F22D]',
    ghost: 'text-[#59636E] hover:text-[#0B1114] hover:bg-[#F0F8E7] active:bg-[#EAFAD5] focus-visible:ring-[#A8F22D]',
    success:
      'bg-[#22B947] text-[#FFFFFF] hover:bg-[#1CA03D] active:bg-[#168532] focus-visible:ring-[#22B947] shadow-xs border border-emerald-500/30'
  };

  const sizes = {
    sm: 'px-3.5 text-xs h-9',
    md: 'px-5 text-sm h-[42px]',
    lg: 'px-6 text-sm h-12'
  };

  return (
    <button
      className={cn(baseStyles, shapes[shape], variants[variant], sizes[size], className || '')}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-3.5 w-3.5 text-current shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
