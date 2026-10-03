'use client';

import React, { useRef } from 'react';
import { X } from 'lucide-react';
import { PlatformLink, platformFocus as focus } from '../platform/PlatformPrimitives';

export function TalkToSales(): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className={`${focus} inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-border-strong bg-white px-[2.5em] py-[0.8em] text-xs font-bold shadow-xs hover:bg-surface-soft lg:text-[0.9em]`}
      >
        Talk to sales
      </button>
      <dialog
        ref={dialog}
        aria-label="Talk to sales"
        className="fixed inset-0 m-auto w-[calc(100%-2.5rem)] max-w-md rounded-2xl border border-border-default bg-white p-7 text-text-primary shadow-xl backdrop:bg-brand-dark/50"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Let’s connect your operations.</h2>
          <button
            type="button"
            autoFocus
            aria-label="Close sales information"
            onClick={() => dialog.current?.close()}
            className={`${focus} grid size-11 shrink-0 place-items-center rounded-full bg-surface-soft`}
          >
            <X className="size-5" />
          </button>
        </div>
        <p className="my-5 text-sm leading-relaxed text-text-secondary">
          Sales booking is not available yet. Explore the platform and resources to learn how
          FieldForge brings your field work together.
        </p>
        <PlatformLink href="/resources">Explore resources</PlatformLink>
      </dialog>
    </>
  );
}
