'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';
import { UserRole } from '@fieldforge/contracts';
import { Input } from '@fieldforge/ui';
import { AuthModal } from '../auth/AuthModal';
import {
  PlatformBrand,
  platformFrame as frame,
  platformFocus as focus
} from '../platform/PlatformPrimitives';
import { Linkedin, SocialX, Youtube } from '../platform/PlatformSocialIcons';

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
export function PricingFooter(): React.JSX.Element {
  const [message, setMessage] = useState('');
  return (
    <footer className="bg-brand-dark text-white">
      <div className={`${frame} py-8 lg:py-[2em]`}>
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-[1.55fr_0.85fr_0.85fr_0.85fr_1.8fr] lg:gap-[2.5em]">
          <div>
            <Link href="/marketing" aria-label="FieldForge home" className={focus}>
              <PlatformBrand small />
            </Link>
            <p className="mt-3 max-w-[15em] text-xs leading-relaxed text-white/75 lg:text-[0.78em]">
              Skilled people. Real work.
              <br />A more connected world.
            </p>
            <div className="mt-3 flex gap-2">
              {[
                { name: 'LinkedIn', href: 'https://linkedin.com', Icon: Linkedin },
                { name: 'X', href: 'https://twitter.com', Icon: SocialX },
                { name: 'YouTube', href: 'https://youtube.com', Icon: Youtube }
              ].map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  aria-label={name}
                  target="_blank"
                  rel="noreferrer"
                  className={`${focus} grid size-11 place-items-center rounded-full bg-white/10 lg:size-[2em]`}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-trust-lime lg:text-[0.8em]">Product</h3>
            <ul className="mt-3 space-y-1 text-xs text-white/80 lg:text-[0.75em]">
              {['Platform', 'Solutions', 'Industries', 'Resources', 'Pricing'].map((name) => (
                <li key={name}>
                  <Link
                    href={`/${name.toLowerCase()}`}
                    aria-current={name === 'Pricing' ? 'page' : undefined}
                    className={`${focus} inline-flex min-h-11 items-center lg:min-h-[1.5em]`}
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold text-trust-lime lg:text-[0.8em]">Resources</h3>
            <ul className="mt-3 space-y-1 text-xs text-white/80 lg:text-[0.75em]">
              {['Blog', 'Help Center', 'Guides', 'Case Studies'].map((name) => (
                <li key={name}>
                  <Link
                    href="/resources"
                    className={`${focus} inline-flex min-h-11 items-center lg:min-h-[1.5em]`}
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold text-trust-lime lg:text-[0.8em]">Company</h3>
            <ul className="mt-3 space-y-2 text-xs text-white/80 lg:text-[0.75em]">
              {['About Us', 'Careers', 'Contact'].map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setMessage('Newsletter subscriptions are not available yet. Please check back soon.');
            }}
          >
            <label htmlFor="pricing-email" className="text-xs lg:text-[0.8em]">
              Subscribe to our newsletter
            </label>
            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] overflow-hidden rounded-lg border border-white/20 bg-white/10">
              <Input
                id="pricing-email"
                aria-label="Newsletter email address"
                type="email"
                required
                placeholder="Enter your email"
                className="h-11! rounded-none! border-0! bg-transparent! text-xs! text-white! placeholder:text-white/65!"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className={`${focus} grid min-h-11 min-w-11 place-items-center bg-brand-green text-brand-dark`}
              >
                <ArrowRight className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-[10px] text-white/70 lg:text-[0.7em]">
              Get the latest updates and field service insights.
            </p>
            <p role="status" className="mt-2 text-xs text-trust-lime">
              {message}
            </p>
          </form>
        </div>
        <div className="mt-7 flex flex-wrap justify-between gap-4 border-t border-white/15 pt-4 text-[10px] text-white/65 lg:text-[0.7em]">
          <p>© {new Date().getFullYear()} FieldForge. All rights reserved.</p>
          <p className="flex flex-wrap gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Cookie Policy</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
