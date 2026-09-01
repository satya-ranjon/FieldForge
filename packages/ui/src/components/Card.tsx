import React from 'react';
import { cn } from '../index';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'highlight';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  ...props
}) => {
  const variants = {
    default: 'bg-slate-900/90 border-slate-800/80 shadow-md',
    elevated: 'bg-slate-900 border-slate-700/80 shadow-lg shadow-black/40',
    glass: 'bg-slate-900/70 border-slate-800/60 backdrop-blur-xl shadow-md',
    highlight: 'bg-slate-900/95 border-blue-600/50 shadow-lg shadow-blue-950/20'
  };

  return (
    <div
      className={cn(
        'rounded-xl border transition-all text-slate-100',
        variants[variant],
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
      'p-5 border-b border-slate-800/80 flex items-center justify-between',
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
    className={cn('text-base font-semibold text-white tracking-tight', className || '')}
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
  <p className={cn('text-xs text-slate-400 mt-0.5', className || '')} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn('p-5', className || '')} {...props}>
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
      'p-4 px-5 border-t border-slate-800/80 bg-slate-950/30 flex items-center',
      className || ''
    )}
    {...props}
  >
    {children}
  </div>
);
