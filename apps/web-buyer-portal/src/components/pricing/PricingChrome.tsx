'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';
import { UserRole } from '@fieldforge/contracts';
import { AuthModal } from '../auth/AuthModal';
import { platformFocus as focus } from '../platform/PlatformPrimitives';

export function TechnicianJoin(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${focus} inline-flex min-h-11 items-center justify-center gap-3 rounded-lg border-2 border-border-strong bg-white px-[1.8em] py-[0.9em] text-xs font-bold hover:bg-surface-soft lg:text-[0.92em]`}
      >
        Join as a Technician <ArrowRight className="size-[1.1em]" />
      </button>
      {open && (
        <AuthModal
          isOpen
          initialMode="register"
          initialRole={UserRole.TECHNICIAN}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
export function PricingContact(): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className={`${focus} inline-flex min-h-11 items-center gap-2 text-xs font-bold text-brand-dark-hover lg:text-[0.9em]`}
      >
        Contact us <ArrowRight className="size-[1.1em]" />
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="pricing-contact-title"
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border-default bg-white p-6 text-text-primary shadow-xl backdrop:bg-brand-dark/60"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="pricing-contact-title" className="text-xl font-bold">
            Pricing questions
          </h2>
          <button
            type="button"
            autoFocus
            aria-label="Close pricing contact"
            onClick={() => dialog.current?.close()}
            className={`${focus} grid size-11 place-items-center rounded-full bg-surface-soft`}
          >
            <X className="size-5" />
          </button>
        </div>
        <p className="my-5 text-sm leading-relaxed text-text-secondary">
          Direct contact options are not configured yet. Explore the resource library for more
          information about planning and managing field work.
        </p>
        <Link
          href="/resources"
          className={`${focus} inline-flex min-h-11 items-center gap-3 rounded-lg bg-brand-dark px-5 text-sm font-bold text-white`}
        >
          Visit the resource library <ArrowRight className="size-4" />
        </Link>
      </dialog>
    </>
  );
}
