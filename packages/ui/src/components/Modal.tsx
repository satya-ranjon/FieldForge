import React, { useEffect } from 'react';
import { cn } from '../index';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl'
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div
        className={cn(
          'relative w-full bg-[#FFFFFF] border border-[#E3E8E1] rounded-2xl shadow-floating overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto',
          maxWidthStyles[maxWidth]
        )}
      >
        {(title || description) && (
          <div className="p-4 sm:p-5 border-b border-[#EBEFE9] flex items-center justify-between gap-4">
            <div>
              {title && (
                <h3 className="text-base sm:text-lg font-bold text-[#090E11] tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-[#59636E] mt-0.5 leading-relaxed">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#59636E] hover:text-[#0B1114] hover:bg-[#F8FAF7] transition focus:outline-none focus:ring-2 focus:ring-[#A8F22D] cursor-pointer"
              aria-label="Close dialog"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="p-4 sm:p-5 max-h-[82vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
