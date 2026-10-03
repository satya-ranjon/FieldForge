'use client';

import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { AuthModal } from '../auth/AuthModal';
import { platformFocus } from '../platform/PlatformPrimitives';

export function IndustrySignup(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${platformFocus} inline-flex min-h-11 items-center justify-center gap-[1em] rounded-lg bg-brand-dark px-[1.8em] py-[0.9em] text-sm font-bold text-white shadow-sm hover:bg-brand-dark-hover lg:text-[0.95em]`}
      >
        Get started <ArrowRight className="size-[1.3em] text-brand-green" />
      </button>
      {open && <AuthModal isOpen onClose={() => setOpen(false)} initialMode="register" />}
    </>
  );
}
