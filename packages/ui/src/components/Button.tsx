import React from 'react';
import { cn } from '../index';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090d16] disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

  const variants = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 focus-visible:ring-blue-500 shadow-md shadow-blue-900/30 hover:shadow-blue-600/25 border border-blue-500/40',
    secondary:
      'bg-slate-800/90 text-slate-200 hover:bg-slate-700/90 active:bg-slate-800 focus-visible:ring-slate-400 border border-slate-700 hover:border-slate-600 shadow-sm',
    danger:
      'bg-red-600/95 text-white hover:bg-red-500 active:bg-red-700 focus-visible:ring-red-500 shadow-sm shadow-red-950/40 border border-red-500/30',
    outline:
      'border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800/60 hover:border-slate-600 active:bg-slate-800 focus-visible:ring-blue-500',
    ghost:
      'text-slate-300 hover:text-white hover:bg-slate-800/60 active:bg-slate-800/80 focus-visible:ring-slate-500',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 focus-visible:ring-emerald-500 shadow-md shadow-emerald-950/40 border border-emerald-500/30'
  };

  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs h-7',
    md: 'px-3.5 py-2 text-xs sm:text-sm h-9',
    lg: 'px-5 py-2.5 text-sm sm:text-base h-11'
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className || '')}
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
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
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
