import React from 'react';
import { cn } from '../index';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface TabsProps<T extends string = string> {
  items: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  variant?: 'pills' | 'underline';
  className?: string;
}

export function Tabs<T extends string = string>({
  items,
  activeTab,
  onChange,
  variant = 'pills',
  className
}: TabsProps<T>): React.JSX.Element {
  if (variant === 'underline') {
    return (
      <nav className={cn('flex space-x-6 border-b border-[#EBEFE9]', className || '')} aria-label="Tabs">
        {items.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'py-3 px-1 border-b-2 text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer',
                isActive
                  ? 'border-[#22B947] text-[#090E11] font-semibold'
                  : 'border-transparent text-[#59636E] hover:text-[#0B1114] hover:border-[#D5DDD2]'
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs rounded-full font-mono',
                    isActive ? 'bg-[#E9F8EC] text-[#18852E]' : 'bg-[#F0F2F3] text-[#59636E]'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      className={cn(
        'flex flex-wrap gap-1.5 p-1 bg-[#FFFFFF] rounded-xl border border-[#E3E8E1] shadow-xs',
        className || ''
      )}
      aria-label="Tabs"
    >
      {items.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer select-none',
              isActive
                ? 'bg-[#22B947] text-white shadow-xs font-bold'
                : 'text-[#59636E] hover:text-[#0B1114] hover:bg-[#F8FAF7]'
            )}
          >
            {Icon && <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-white' : 'text-[#59636E]')} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                  isActive ? 'bg-white/20 text-white' : 'bg-[#F0F2F3] text-[#59636E]'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
