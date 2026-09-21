import React from 'react';
import { cn } from '../index';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'metric' | 'soft-green' | 'dark' | 'floating' | 'interactive';
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
    default: 'bg-[#FFFFFF] border-[#E3E8E1] text-[#0B1114] shadow-xs',
    metric: 'bg-[#FFFFFF] border-[#E3E8E1] text-[#0B1114] p-4 sm:p-5',
    'soft-green': 'bg-[#F0F8E7] border-[#DFECD5] text-[#0B1114]',
    dark: 'bg-[#081A15] border-white/10 text-white shadow-xs',
    floating: 'bg-white/95 backdrop-blur-md border-[#E3E8E1] text-[#0B1114] shadow-floating',
    interactive:
      'bg-[#FFFFFF] border-[#E3E8E1] text-[#0B1114] hover:border-[#D1D9CE] hover:shadow-sm cursor-pointer'
  };

  return (
    <div
      className={cn(
        'relative rounded-[14px] border transition-all duration-150',
        variants[variant],
        (interactive || variant === 'interactive') &&
          'hover:border-[#D1D9CE] hover:shadow-sm hover:-translate-y-0.5 cursor-pointer',
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
      'p-4 sm:p-5 border-b border-[#EBEFE9] flex items-center justify-between gap-3',
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
    className={cn(
      'text-sm sm:text-base font-semibold tracking-tight text-[#090E11]',
      className || ''
    )}
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
  <p className={cn('text-xs text-[#59636E] mt-0.5 leading-relaxed', className || '')} {...props}>
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
      'p-3.5 sm:p-4 px-4 sm:px-5 border-t border-[#EBEFE9] bg-[#F8FAF7] flex items-center justify-between rounded-b-[14px] gap-2',
      className || ''
    )}
    {...props}
  >
    {children}
  </div>
);
