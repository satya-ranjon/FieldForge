import React from 'react';
import { cn } from '../index';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'highlight' | 'subtle';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  interactive = false,
  ...props
}) => {
  const variants = {
    default: 'bg-[#0f172a]/90 border-slate-800/80 shadow-sm backdrop-blur-sm',
    elevated: 'bg-[#0f172a] border-slate-700/90 shadow-xl shadow-black/50',
    glass: 'bg-[#0f172a]/75 border-slate-800/80 backdrop-blur-xl shadow-lg shadow-black/30',
    highlight: 'bg-[#0f172a]/95 border-blue-500/50 shadow-lg shadow-blue-950/30',
    subtle: 'bg-[#090d16]/80 border-slate-800/60 shadow-none'
  };

  return (
    <div
      className={cn(
        'relative rounded-xl border transition-all duration-200 text-slate-100',
        'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/[0.08] before:to-transparent before:pointer-events-none',
        variants[variant],
        interactive &&
          'hover:border-slate-700 hover:shadow-md hover:translate-y-[-1px] cursor-pointer',
        className || ''
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div
    className={cn(
      'p-4 sm:p-5 border-b border-slate-800/70 flex items-center justify-between gap-3',
      className || ''
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => (
  <h3
    className={cn('text-sm sm:text-base font-semibold text-white tracking-tight', className || '')}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => (
  <p className={cn('text-xs text-slate-400 mt-0.5 leading-relaxed', className || '')} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn('p-4 sm:p-5', className || '')} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div
    className={cn(
      'p-3.5 sm:p-4 px-4 sm:px-5 border-t border-slate-800/70 bg-[#090d16]/40 flex items-center justify-between rounded-b-xl gap-2',
      className || ''
    )}
    {...props}
  >
    {children}
  </div>
);
