import React from 'react';
import { cn } from '../index';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-[#59636E]">
          {label}
        </label>
      )}
      <div className="relative rounded-xl">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7D8791]">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full h-[42px] bg-[#FFFFFF] border border-[#DDE4DA] rounded-xl px-3.5 text-sm text-[#0B1114] placeholder-[#929BA3] shadow-xs',
            'focus:outline-none focus:ring-2 focus:ring-[#A8F22D]/20 focus:border-[#A8F22D] transition-all duration-150',
            'disabled:opacity-50 disabled:bg-[#F8FAF7] disabled:cursor-not-allowed',
            leftIcon ? 'pl-10' : '',
            rightIcon ? 'pr-10' : '',
            error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : '',
            className || ''
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#7D8791]">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-[#F04444] font-medium flex items-center gap-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-[#7D8791]">{helperText}</p>}
    </div>
  );
};

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className,
  id,
  rows = 4,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-[#59636E]">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={cn(
          'w-full bg-[#FFFFFF] border border-[#DDE4DA] rounded-xl p-3.5 text-sm text-[#0B1114] placeholder-[#929BA3] shadow-xs',
          'focus:outline-none focus:ring-2 focus:ring-[#A8F22D]/20 focus:border-[#A8F22D] transition-all duration-150 resize-y',
          'disabled:opacity-50 disabled:bg-[#F8FAF7] disabled:cursor-not-allowed',
          error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : '',
          className || ''
        )}
        {...props}
      />
      {error && <p className="text-xs text-[#F04444] font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-[#7D8791]">{helperText}</p>}
    </div>
  );
};

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  children,
  className,
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-[#59636E]">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          'w-full h-[42px] bg-[#FFFFFF] border border-[#DDE4DA] rounded-xl px-3.5 text-sm text-[#0B1114] shadow-xs',
          'focus:outline-none focus:ring-2 focus:ring-[#A8F22D]/20 focus:border-[#A8F22D] transition-all duration-150',
          'disabled:opacity-50 disabled:bg-[#F8FAF7] disabled:cursor-not-allowed cursor-pointer',
          error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : '',
          className || ''
        )}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white text-[#0B1114]">
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && <p className="text-xs text-[#F04444] font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-[#7D8791]">{helperText}</p>}
    </div>
  );
};
